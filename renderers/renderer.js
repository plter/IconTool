// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require("electron");
const url = require("url");
const path = require("path");
const fs = require("fs");
const SizeCheckbox = require("./SizeCheckbox");
const ToIco = require("to-ico");
const ImageSize = require("./ImageSize");
const ImageDataBufferCache = require("./ImageDataBufferCache");
const os = require("os");
const ChildProcess = require("child_process");

class Renderer {


    constructor() {
        this._iconsetOutputPathId = 0;
        this._imageDataCache = new ImageDataBufferCache();
        this._iconsetSizes = [
            new ImageSize(16, 16), new ImageSize(18, 18), new ImageSize(24, 24), new ImageSize(32, 32),
            new ImageSize(48, 48), new ImageSize(64, 64), new ImageSize(72, 72), new ImageSize(96, 96),
            new ImageSize(128, 128), new ImageSize(256, 256), new ImageSize(512, 512)
        ];
        this._icoSizes = [
            new ImageSize(16, 16), new ImageSize(24, 24), new ImageSize(32, 32), new ImageSize(48, 48),
            new ImageSize(64, 64), new ImageSize(128, 128), new ImageSize(256, 256)
        ];
        this._sizeCheckboxes = new Map();

        this.loadScripts();
        this.buildUI();
        this.addListeners();
    }

    loadScripts() {
        window.$ = window.jQuery = require("jquery");
        require("bootstrap");
    }

    buildUI() {
        this._root = document.querySelector("#root");
        this.window_resizeHandler();

        this._previewImage = document.querySelector("#preview-image");
        this._btnConvert = document.querySelector("#btn-convert");

        this._checkboxContainer1 = document.querySelector("#checkbox-container1");
        for (let i = 0; i < 4; i++) {
            let size = this._iconsetSizes[i];
            let cb = new SizeCheckbox(size);
            this._checkboxContainer1.appendChild(cb.htmlNode);
            this._sizeCheckboxes.set(size.key, cb);
        }
        this._checkboxContainer2 = document.querySelector("#checkbox-container2");
        for (let i = 4; i < 8; i++) {
            let size = this._iconsetSizes[i];
            let cb = new SizeCheckbox(size);
            this._checkboxContainer2.appendChild(cb.htmlNode);
            this._sizeCheckboxes.set(size.key, cb);
        }
        this._checkboxContainer3 = document.querySelector("#checkbox-container3");
        for (let i = 8; i < this._iconsetSizes.length; i++) {
            let size = this._iconsetSizes[i];
            let cb = new SizeCheckbox(size);
            this._checkboxContainer3.appendChild(cb.htmlNode);
            this._sizeCheckboxes.set(size.key, cb);
        }

        document.querySelector("#version-div").innerHTML = `版本： v${electron.remote.app.getVersion()}`;
    }

    addListeners() {
        window.onresize = this.window_resizeHandler.bind(this);
        this._previewImage.onclick = this.presetImage_clickedHandler.bind(this);
        this._btnConvert.onclick = this.btnConvert_clickedHandler.bind(this);
        document.querySelector("#btn-nav-to-source").onclick = e => electron.shell.openExternal("https://github.com/plter/IconTool");
    }

    window_resizeHandler() {
        this._root.style.width = window.innerWidth + "px";
        this._root.style.height = window.innerHeight + "px";
    }

    /**
     * @return {Promise}
     */
    loadImage(src) {
        return new Promise(resolve => {
            let img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.src = src;
        });
    }

    async presetImage_clickedHandler() {
        let path = electron.remote.dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
            title: "选择一个 1024x1024 的PNG图片",
            properties: ["openFile"],
            filters: [
                {name: 'PNG(1024x1024)', extensions: ['png']},
            ]
        });

        if (path && path.length) {
            this._currentImagePath = path[0];
            let theUrl = url.format({
                pathname: this._currentImagePath,
                protocol: "file",
                slashes: true
            });

            let img = await this.loadImage(theUrl);
            if (img.width === 1024 && img.height === 1024) {
                this._previewImage.src = theUrl;
                this._currentImage = img;
            } else {
                alert("所选图片必须是尺寸为 1024x1024 的 PNG 图片");
            }
        }
    }

    async btnConvert_clickedHandler() {
        if (this._currentImagePath) {
            let fileName = path.basename(this._currentImagePath, ".png");
            let fileDirPath = path.dirname(this._currentImagePath);

            let resultFileName = `${fileName}${this._iconsetOutputPathId > 0 ? this._iconsetOutputPathId : ""}`;
            let iconsetOutputPath = path.join(fileDirPath, `${resultFileName}.iconset`);
            let icoOutputPath = path.join(fileDirPath, `${resultFileName}.ico`);
            let icnsOutputPath = path.join(fileDirPath, `${resultFileName}.icns`);
            while (fs.existsSync(iconsetOutputPath)) {
                this._iconsetOutputPathId++;
                resultFileName = `${fileName}${this._iconsetOutputPathId}`;
                iconsetOutputPath = path.join(fileDirPath, `${resultFileName}.iconset`);
                icoOutputPath = path.join(fileDirPath, `${resultFileName}.ico`);
                icnsOutputPath = path.join(fileDirPath, `${resultFileName}.icns`);
            }

            fs.mkdirSync(iconsetOutputPath);
            this._imageDataCache.clear();

            //generate iconset
            this._sizeCheckboxes.forEach(value => {
                if (value.checkbox.checked) {
                    this.writeScaledImageDataBufferTo(this._currentImage, value.size, iconsetOutputPath, true);
                }
            });
            //generate ico
            let icoSubFiles = [];
            this._icoSizes.forEach(value => {
                this.checkToAddSizedImageBufferToIcoSubFilesArray(icoSubFiles, this._currentImage, value);
            });
            let icoBuffer = await ToIco(icoSubFiles);
            fs.writeFileSync(icoOutputPath, icoBuffer);

            //generate icns
            if (os.type() === "Darwin") {
                ChildProcess.exec(`iconutil --convert icns ${iconsetOutputPath} --output ${icnsOutputPath}`);
            }

            electron.shell.showItemInFolder(icoOutputPath);
        } else {
            alert("请先选择一个尺寸为 1024x1024 的 PNG 图片");
        }
    }

    /**
     * @param icoSubFiles
     * @param image {HTMLImageElement}
     * @param size {ImageSize}
     */
    checkToAddSizedImageBufferToIcoSubFilesArray(icoSubFiles, image, size) {
        let cb = this._sizeCheckboxes.get(size.key);
        if (cb.checkbox.checked) {
            icoSubFiles.push(this._imageDataCache.getOrCreateBuffer(image, size));
        }
    }

    /**
     *
     * @param image
     * @param size {ImageSize}
     * @param destDir
     * @param with2x
     */
    writeScaledImageDataBufferTo(image, size, destDir, with2x = true) {
        fs.writeFileSync(path.join(destDir, `icon_${size.w}x${size.h}.png`), this._imageDataCache.getOrCreateBuffer(image, size));

        if (with2x) {
            fs.writeFileSync(path.join(destDir, `icon_${size.w}x${size.h}@2x.png`), this._imageDataCache.getOrCreateBuffer(image, new ImageSize(size.w * 2, size.h * 2)));
        }
    }
}

new Renderer();