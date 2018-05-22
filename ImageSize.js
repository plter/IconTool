class ImageSize {

    constructor(w, h) {
        this._w = w;
        this._h = h;
        this._key = `${this._w}x${this._h}`;
    }

    get w() {
        return this._w;
    }

    get h() {
        return this._h;
    }

    get key() {
        return this._key;
    }
}

module.exports = ImageSize;