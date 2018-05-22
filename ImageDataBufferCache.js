class ImageDataBufferCache {


    constructor() {
        this.clear();
        this._canvas = document.createElement("canvas");
        this._ctx = this._canvas.getContext("2d");
    }

    /**
     *
     * @param image {HTMLImageElement}
     * @param size {ImageSize}
     * @return {Buffer2}
     */
    getOrCreateBuffer(image, size) {
        let buf = this._cache.get(size.key);
        if (!buf) {
            let canvas = this._canvas;
            canvas.width = size.w;
            canvas.height = size.h;
            let ctx = this._ctx;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            let imageBase64Data = canvas.toDataURL("image/png").split(",")[1];
            buf = Buffer.from(imageBase64Data, "base64");
            this._cache.set(size.key, buf);
        }
        return buf;
    }

    clear() {
        this._cache = new Map();
    }
}

module.exports = ImageDataBufferCache;