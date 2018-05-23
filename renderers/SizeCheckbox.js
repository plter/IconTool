class SizeCheckbox {

    constructor(size) {
        this._size = size;
        this._htmlNode = document.createElement("label");
        this._htmlNode.style.margin = "0 5px";
        this._checkbox = document.createElement("input");
        this._checkbox.type = "checkbox";
        this._checkbox.checked = true;
        this._htmlNode.appendChild(this._checkbox);
        this._span = document.createElement("span");
        this._span.innerHTML = `${size.w}x${size.h}`;
        this._htmlNode.appendChild(this._span);
    }

    get size() {
        return this._size;
    }

    get checkbox() {
        return this._checkbox;
    }

    get htmlNode() {
        return this._htmlNode;
    }
}

module.exports = SizeCheckbox;