const FilterNode = require("./filterNode.js");
const TemplateError = require("./templateError.js");
const constant = require("./constant.js");

const stages = {
    KEY: "Key",
    VALUE: "Value"
};

class ObjectFilterNode extends FilterNode {
    constructor(rawFilter, line, depth) {
        super(rawFilter, line, depth);
    }

    getChildren() {
        const children = [];
        for (let i = 0, length = this._children.length; i < length; i++) {
            children.push(this._children[i].node);
        }
        return children;
    }

    addChild(child) {
        const nodeBeforeLastNode = this.getLastChild();
        for (let i = 0, length = this._children.length; i < length; i++) {
            if (this._children[i].node === null) {
                this._children[i].node = child;
                break;
            }
        }
        child.addParent(this);
        if (nodeBeforeLastNode !== null) {
            nodeBeforeLastNode.addNext(this.getLastChild());
        }
    }

    getFirstChild() {
        if (this.hasChildren() === true) {
            return this._children[0].node;
        } else {
            return null;
        }
    }

    getLastChild() {
        if (this.hasChildren() === true) {
            for (let i = this._children.length - 1; i >= 0; i--) {
                if (this._children[i].node !== null) {
                    return this._children[i].node;
                }
            }
        } else {
            return null;
        }
    }

    hasChildren() {
        for (let i = 0, length = this._children.length; i < length; i++) {
            if (this._children[i].node !== null) {
                return true;
            }
        }
        return false;
    }

    _parse() {
        let singleQuote = false;
        let doubleQuote = false;
        let curlyBracket = 0;
        let squareBracket = 0;
        let bracket = 0;

        if (this._rawFilter[0] !== constant.CURLY_BRACKET_OPEN) {
            throw new TemplateError("Expected " + constant.CURLY_BRACKET_OPEN + " but found " + this._rawFilter[0], this._line);
        }

        if (this._rawFilter[this._rawFilter.length - 1] !== constant.CURLY_BRACKET_CLOSE) {
            throw new TemplateError("Expected " + constant.CURLY_BRACKET_CLOSE + " but found " + this._rawFilter[this._rawFilter.length - 1], this._line);
        }

        this._rawFilter = this._rawFilter.slice(1, -1).trim();

        if (this._rawFilter.length === 0) {
            return this;
        }

        let start = 0;

        let currentStage = stages.KEY;
        let tempKey = null;
        for (let i = 0, length = this._rawFilter.length; i < length; i++) {
            if (this._rawFilter[i] === constant.CURLY_BRACKET_OPEN && singleQuote === false && doubleQuote === false) {
                curlyBracket++;
            } else if (this._rawFilter[i] === constant.CURLY_BRACKET_CLOSE && singleQuote === false && doubleQuote === false) {
                curlyBracket--;
            } else if (this._rawFilter[i] === constant.SQUARE_BRACKET_OPEN && singleQuote === false && doubleQuote === false) {
                squareBracket++;
            } else if (this._rawFilter[i] === constant.SQUARE_BRACKET_CLOSE && singleQuote === false && doubleQuote === false) {
                squareBracket--;
            } else if (this._rawFilter[i] === constant.BRACKET_OPEN && singleQuote === false && doubleQuote === false) {
                bracket++;
            } else if (this._rawFilter[i] === constant.BRACKET_CLOSE && singleQuote === false && doubleQuote === false) {
                bracket--;
            }

            if (this._rawFilter[i] === constant.SINGLE_QUOTE && doubleQuote === false) {
                singleQuote = !singleQuote;
            } else if (this._rawFilter[i] === constant.DOUBLE_QUOTE && singleQuote === false) {
                doubleQuote = !doubleQuote;
            } else if ((this._rawFilter[i] === constant.COLON || this._rawFilter[i] === constant.COMMA) && singleQuote === false && doubleQuote === false && squareBracket === 0 && curlyBracket === 0 && bracket === 0) {
                if (currentStage === stages.KEY) {
                    tempKey = this._rawFilter.substring(start, i).trim();
                    if (tempKey[0] === constant.SINGLE_QUOTE) {
                        if (tempKey[tempKey.length - 1] !== constant.SINGLE_QUOTE) {
                            throw new TemplateError("Expected " + constant.SINGLE_QUOTE + " but found " + tempKey[tempKey.length - 1], this._line);
                        }
                        tempKey = tempKey.slice(1, -1).trim();
                    } else if (tempKey[0] === constant.DOUBLE_QUOTE) {
                        if (tempKey[tempKey.length - 1] !== constant.DOUBLE_QUOTE) {
                            throw new TemplateError("Expected " + constant.DOUBLE_QUOTE + " but found " + tempKey[tempKey.length - 1], this._line);
                        }
                        tempKey = tempKey.slice(1, -1).trim();
                    }
                    currentStage = stages.VALUE;
                } else if (currentStage === stages.VALUE) {
                    const value = this._rawFilter.substring(start, i).trim();
                    this.addChildToBuild(value);
                    this._children.push({
                        key: tempKey,
                        value: value,
                        node: null
                    });
                    tempKey = null;
                    currentStage = stages.KEY;
                }
                start = i + 1;
                singleQuote = false;
                doubleQuote = false;
            }
        }
        if (tempKey === null) {
            throw new TemplateError("Syntax error: Unexpected identifier", this._line);
        }
        const value = this._rawFilter.substring(start, this._rawFilter.length).trim();
        this.addChildToBuild(value);
        this._children.push({
            key: tempKey,
            value: value,
            node: null
        });
        return this;
    }

    execute(input, context, filters) {
        this._result = {};
        for (let i = 0, length = this._children.length; i < length; i++) {
            this._result[this._children[i].key] = this._children[i].node.getResult();
        }
        this._executed = true;
        return this;
    }

    reset() {
        this._executed = false;
        this._result = null;
        if (this.hasChildren()) {
            for (let i = 0; i < this._children.length; i++) {
                this._children[i].node.reset();
            }
        }
        if (this.hasNext()) {
            return this.getNext();
        } else {
            return null;
        }
    }
}

module.exports = ObjectFilterNode;