const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const NodeFactory = require('../lib/nodeFactory.js');
const Node = require('../lib/node.js');
const Tag = require('../lib/tag.js');
const Template = require('../lib/template.js');
const Context = require('../lib/context.js');
const TemplateError = require('../lib/templateError.js');
const BadParameterError = require('../lib/badParameterError.js');
const LogicError = require('../lib/logicError.js');

describe('Node', function () {
    it('Node constructor() success', function () {
        const tag = new Tag(0, " ", 0);
        const depth = 0;
        let node = null;
        const testFunc = function () {
            node = new Node(tag, depth);
        }
        expect(testFunc).to.not.throw();

        assert.equal(node.open, tag);
        assert.equal(node._close, null);
        assert.equal(node.depth, 0);
        assert.equal(node._next, null);
        assert.equal(node._previous, null);
        assert.equal(node._parent, null);
        assert.deepEqual(node._children, []);
        assert.equal(node._category, null);
        assert.equal(node.template, null);
        assert.equal(node._preExecuted, false);
        assert.equal(node._postExecuted, false);
        assert.equal(node._context, null);
        assert.equal(node._filterInstances, null);
        assert.equal(node._relativeStart, null);
        assert.equal(node._relativeEnd, null);
        assert.equal(node.result, null);

    });

    it('Node constructor() failure', function () {
        const tag = new Tag(0, " ", 0);
        const testFuncWithNoParameters = function () {
            const node = new Node();
        }
        const testFuncWithBadFirstParameters = function () {
            const node = new Node("not good", "not good");
        }
        const testFuncWithBadSecondParameters = function () {
            const node = new Node(tag, "not good");
        }
        expect(testFuncWithNoParameters).to.throw(/*TODO error type*/);
        expect(testFuncWithBadFirstParameters).to.throw(/*TODO error type*/);
        expect(testFuncWithBadSecondParameters).to.throw(/*TODO error type*/);
    });

    it('Node complete() failure', function () {
        const template = new Template("This is a template test. This is a template. This is a template.");
        const node = new Node(new Tag(5, "{% if value %}", 0), 0);
        const testFirstParam = function () {
            node.complete("This is not a Tag", template);
        };
        expect(testFirstParam).to.throw(BadParameterError);

        const testSecondParam = function () {
            node.complete(new Tag(20, "{% endif %}", 3), "This is not a template");
        };
        expect(testSecondParam).to.throw(BadParameterError);

        const testIsCloseType = function () {
            node.complete(new Tag(20, "{% if test %}", 3), template);
        }
        expect(testIsCloseType).to.throw(LogicError);

        const testIsCompatible = function () {
            node.complete(new Tag(20, "{% endfor %}", 3), template);
        };
        expect(testIsCompatible).to.throw(TemplateError);

        node.complete(new Tag(20, "{% endif %}", 3), template);
        const testIsClosed = function () {
            node.complete(new Tag(20, "{% endif %}", 3), template);
        };
        expect(testIsClosed).to.throw(TemplateError);


    });

    it('Node complete() success #1', function () {
        const template = new Template("{% if value %}late test. This is a template. This is a template.");
        const node = new Node(new Tag(0, "{% if value %}", 0), 0);
        const completeTag = new Tag(20, "{% endif %}", 3);
        const testFunc = function () {
            node.complete(completeTag, template);
        }
        expect(testFunc).to.not.throw();
        assert.equal(node._close, completeTag);
        const testTemplate = new Template("late t");
        assert.deepEqual(node.template, testTemplate);

        assert.equal(node.relativeStart, node.start);
        assert.equal(node.relativeEnd, node.end);

    });

    it('Node complete() success #2', function () {
        const template = new Template("This is a template test. This is a template. This is a template.");
        const node = new Node(new Tag(0, "{% if value %}", 0), 0);
        const completeTag = new Tag(20, "{% endif %}", 3);
        node.addParent(new Node(new Tag(0, "{% if value2 %}", 5), 0));
        node.complete(completeTag, template);

        assert.equal(node.relativeStart, null);
        assert.equal(node.relativeEnd, null);
    });

    it('Node complete() success #3', function () {
        const template = new Template(" {% if value %}This is a template test.{% if value2 %}This is a template.{% endif %}This is a template.{% endif %}");
        const node = new Node(new Tag(1, "{% if value %}", 0), 0);
        const node1 = new Node(new Tag(39, "{% if value2 %}", 0), 0);
        const completeTag1 = new Tag(103, "{% endif %}", 3);
        const completeTag2 = new Tag(73, "{% endif %}", 3);
        node1.complete(completeTag2, template);
        node1.addParent(node);
        node.complete(completeTag1, template);

        assert.equal(node1.relativeStart, 24);
        assert.equal(node1.relativeEnd, 69);
    });

    it('Node computeRelativePositions()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const tag1 = new Tag(23, "  tag2  ", 5);
        node1._close = tag1;
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);
        const tag2 = new Tag(23, "  tag2  ", 5);
        node2._close = tag2;

        node1.computeRelativePositions(null);
        assert.equal(node1.relativeStart, node1.open.start);
        assert.equal(node1.relativeEnd, node1.close.end);
    });

    it('Node replaceRender() : success', function () {
        const template = new Template("{% if value %}This is a template test.{% if value2 %}This is a template.{% endif %}This is a template.{% endif %}");
        const node1 = new Node(new Tag(0, "{% if value %}", 0), 0);
        const node2 = new Node(new Tag(38, "{% if value2 %}", 0), 0);
        const completeTag1 = new Tag(102, "{% endif %}", 3);
        const completeTag2 = new Tag(72, "{% endif %}", 3);
        node2.addParent(node1);
        node2.complete(completeTag2, template);
        node1.complete(completeTag1, template);
        node2.result = new Template("This is a template.");
        node2.relativeStart = 0;
        node2.relativeEnd = template.length - 1;

        node2.replaceRender(node1.template);
        assert.deepEqual(node1.template, node2.result);
    });

    it('Node replaceRender() : failure', function () {
        const node = new Node(new Tag(38, "{% if value2 %}", 0), 0);


        const testFunc = function () {
            node.replaceRender("This is not a Template");
        };

        expect(testFunc).to.throw(BadParameterError);
    });

    it('Node get start()', function () {
        const template = new Template("This is a template test. This is a template. This is a template.");
        const node = new Node(new Tag(5, "{% if value %}", 0), 0);
        node.complete(new Tag(20, "{% endif %}", 3), template);
        assert.equal(node.start, 5);
    });

    it('Node get end() with close tag', function () {
        const template = new Template("{% if value %}This is a template test.{% endif %} This is a template. This is a template.");
        const node = new Node(new Tag(0, "{% if value %}", 0), 0);
        node.complete(new Tag("{% if value %}This is a template test.".length - 1, "{% endif %}", 3), template);
        assert.equal(node.end, "{% if value %}This is a template test.{% endif %}".length - 1);
    });

    it('Node get end() without close tag', function () {
        const template = new Template("This is a template test. This is a template. This is a template.");
        const node = new Node(new Tag(0, "{{ variableName }}", 0), 0);
        assert.equal(node.end, 18);
    });

    it('Node isCompatibleTag() var category', function () {
        const tag1 = new Tag(0, "{{ var }}", 0);
        const tag2 = new Tag(0, "{% endfor %}", 0);
        const tag3 = new Tag(0, "{{ lol }}", 0);
        const tag4 = new Tag(0, "{% endif %}", 0);
        const tag5 = new Tag(0, "{% if test === type %}", 0);
        const tag6 = new Tag(0, "{% for user in users %}", 0);
        const node = new Node(tag1, 0);

        assert.equal(node.isCompatibleTag(tag1), true);
        assert.equal(node.isCompatibleTag(tag2), false);
        assert.equal(node.isCompatibleTag(tag3), true);
        assert.equal(node.isCompatibleTag(tag4), false);
        assert.equal(node.isCompatibleTag(tag5), false);
        assert.equal(node.isCompatibleTag(tag6), false);

    });

    it('Node isCompatibleTag() if category', function () {
        const tag1 = new Tag(0, "{% if test === type %}", 0);
        const tag2 = new Tag(0, "{% endfor %}", 0);
        const tag3 = new Tag(0, "{{ lol }}", 0);
        const tag4 = new Tag(0, "{% endif %}", 0);
        const tag5 = new Tag(0, "{{ var }}", 0);
        const tag6 = new Tag(0, "{% for user in users %}", 0);
        const node = new Node(tag1, 0);

        assert.equal(node.isCompatibleTag(tag1), true);
        assert.equal(node.isCompatibleTag(tag2), false);
        assert.equal(node.isCompatibleTag(tag3), false);
        assert.equal(node.isCompatibleTag(tag4), true);
        assert.equal(node.isCompatibleTag(tag5), false);
        assert.equal(node.isCompatibleTag(tag6), false);

    });

    it('Node isCompatibleTag() for category', function () {
        const tag1 = new Tag(0, "{% for user in users %}", 0);
        const tag2 = new Tag(0, "{% endfor %}", 0);
        const tag3 = new Tag(0, "{{ lol }}", 0);
        const tag4 = new Tag(0, "{% endif %}", 0);
        const tag5 = new Tag(0, "{{ var }}", 0);
        const tag6 = new Tag(0, "{% if test === type %}", 0);
        const node = new Node(tag1, 0);

        assert.equal(node.isCompatibleTag(tag1), true);
        assert.equal(node.isCompatibleTag(tag2), true);
        assert.equal(node.isCompatibleTag(tag3), false);
        assert.equal(node.isCompatibleTag(tag4), false);
        assert.equal(node.isCompatibleTag(tag5), false);
        assert.equal(node.isCompatibleTag(tag6), false);
    });

    it('Node set/get open(): success', function () {
        const tag1 = new Tag(0, "  node  ", 0);
        const tag2 = new Tag(0, "  node  ", 0);
        const node = new Node(tag1, 0);

        assert.equal(node.open, tag1);

        node.open = tag2;

        assert.equal(node.open, tag2);
    });

    it('Node set open(): failure', function () {
        const tag1 = new Tag(0, "  node  ", 0);
        const node = new Node(tag1, 0);

        const testFunc = function () {
            node.open = "This is not a Tag";
        };

        expect(testFunc).to.throw(BadParameterError);
    });

    it('Node set/get close()', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);
        const tag = new Tag(0, "  node  ", 0);

        assert.equal(node.close, null);

        node.close = tag

        assert.equal(node.close, tag);
    });

    it('Node isClosed() standalone type', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);
        const tag = new Tag(0, "  node  ", 0);

        assert.equal(node.isClosed(), true);

        node.close = tag;

        assert.equal(node.isClosed(), true);
    });

    it('Node isClosed() other type', function () {
        const node = new Node(new Tag(0, "{% for user in users %}", 0), 0);
        const tag = new Tag(0, "{% endfor %}", 0);

        assert.equal(node.isClosed(), false);

        node.close = tag;

        assert.equal(node.isClosed(), true);
    });

    it('Node set/get depth()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node1  ", 0), 1);

        assert.equal(node1.depth, 0);
        assert.equal(node2.depth, 1);

        node1.depth = 10;
        node2.depth = 11;

        assert.equal(node1.depth, 10);
        assert.equal(node2.depth, 11);
    });


    it('Node set/get next()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.equal(node1.next, null);
        assert.equal(node2.next, null);

        node1.next = node2;

        assert.equal(node1.next, node2);
        assert.equal(node2.next, null);
    });

    it('Node set/get previous()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.equal(node1.previous, null);
        assert.equal(node2.previous, null);

        node2.previous = node1;

        assert.equal(node1.previous, null);
        assert.equal(node2.previous, node1);
    });

    it('Node hasPrevious()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.equal(node1.hasPrevious(), false);
        assert.equal(node2.hasPrevious(), false);

        node2.previous = node1;

        assert.equal(node1.hasPrevious(), false);
        assert.equal(node2.hasPrevious(), true);
    });

    it('Node addNext()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);

        assert.deepEqual(child1.next, null);
        assert.deepEqual(child2.previous, null);
        assert.deepEqual(child2.parent, null);

        child1.addParent(parent)
        child1.addNext(child2);

        assert.deepEqual(child1.next, child2);
        assert.deepEqual(child2.previous, child1);
        assert.deepEqual(child2.parent, child1.parent);
    });

    it('Node _addNext()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.deepEqual(node1.next, null);
        assert.deepEqual(node2.previous, null);

        node1._addNext(node2);

        assert.deepEqual(node1.next, node2);
        assert.deepEqual(node2.previous, node1);
    });

    it('Node set/get parent()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child = new Node(new Tag(0, "  child1  ", 0), 0);

        assert.equal(child.parent, null);

        child.parent = parent

        assert.equal(child.parent, parent);
    });

    it('Node _addParent()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child = new Node(new Tag(0, "  child1  ", 0), 0);

        assert.equal(child.parent, null);

        child._addParent(parent);

        assert.equal(child.parent, parent);
    });

    it('Node addParent()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);

        const testFuncAddFirst = function () {
            child1.addParent(parent);
        }

        expect(testFuncAddFirst).to.not.throw();
        assert.deepEqual(child1.parent, parent);
        assert.deepEqual(parent.children[0], child1);

        const testFuncAddSecond = function () {
            child2.addParent(parent);
        }

        expect(testFuncAddSecond).to.not.throw();
        assert.deepEqual(child2.parent, parent);
        assert.deepEqual(parent.children[1], child2);

        assert.deepEqual(child1.next, child2);
        assert.deepEqual(child2.previous, child1);
    });

    it('Node get children()', function () {
        const node = new Node(new Tag(0, " ", 0), 0);
        assert.deepEqual(node.children, []);
    });

    it('Node _addChild()', function () {
        const parent = new Node(new Tag(0, " ", 0), 0);
        const child = new Node(new Tag(0, " ", 0), 0);

        assert.equal(parent.children.length, 0);

        parent._addChild(child);

        assert.equal(parent.children[0], child);
    });

    it('Node get category()', function () {
        const node = new Node(new Tag(0, " ", 0), 0);
        assert.exists(node.category);
    });

    it('Node isIfCategory()', function () {
        const node = new Node(new Tag(0, "{% if user %}", 0), 0);
        assert.equal(node.isIfCategory(), true);
        assert.equal(node.isForCategory(), false);
        assert.equal(node.isVarCategory(), false);
    });

    it('Node isForCategory()', function () {
        const node = new Node(new Tag(0, "{% for user in users %}", 0), 0);
        assert.equal(node.isIfCategory(), false);
        assert.equal(node.isForCategory(), true);
        assert.equal(node.isVarCategory(), false);
    });

    it('Node isVarCategory()', function () {
        const node = new Node(new Tag(0, "{{ var }}", 0), 0);
        assert.equal(node.isIfCategory(), false);
        assert.equal(node.isForCategory(), false);
        assert.equal(node.isVarCategory(), true);
    });

    it('Node hasChildren()', function () {
        const parent = new Node(new Tag(0, " ", 0), 0);
        const child = new Node(new Tag(0, " ", 0), 0);

        assert.equal(parent.hasChildren(), false);

        parent._children.push(child);

        assert.equal(parent.hasChildren(), true);
    });

    it('Node getFirstChildren()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);
        const child3 = new Node(new Tag(0, "  child3  ", 0), 0);

        assert.equal(parent.getFirstChildren(), null);

        child1.addParent(parent);
        child2.addParent(parent);
        child3.addParent(parent);

        assert.equal(parent.getFirstChildren(), child1);
    });

    it('Node getLastChildren()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);
        const child3 = new Node(new Tag(0, "  child3  ", 0), 0);

        assert.equal(parent.getLastChildren(), null);

        child1.addParent(parent);
        child2.addParent(parent);
        child3.addParent(parent);

        assert.equal(parent.getLastChildren(), child3);
    });

    it('Node hasNext()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.equal(node1.hasNext(), false);

        node1.addNext(node2);

        assert.equal(node1.hasNext(), true);
    });

    it('Node getNext()', function () {
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);

        assert.equal(node1.getNext(), null);

        node1.addNext(node2);

        assert.equal(node1.getNext(), node2);
    });

    it('Node hasParent()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);
        const child3 = new Node(new Tag(0, "  child3  ", 0), 0);

        assert.equal(child1.hasParent(), false);
        assert.equal(child2.hasParent(), false);
        assert.equal(child3.hasParent(), false);

        child1.addParent(parent);
        child2.addParent(parent);
        child3.addParent(parent);

        assert.equal(child1.hasParent(), true);
        assert.equal(child2.hasParent(), true);
        assert.equal(child3.hasParent(), true);
    });

    it('Node getParent()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);
        const child3 = new Node(new Tag(0, "  child3  ", 0), 0);

        assert.equal(child1.getParent(), null);
        assert.equal(child2.getParent(), null);
        assert.equal(child3.getParent(), null);

        child1.addParent(parent);
        child2.addParent(parent);
        child3.addParent(parent);

        assert.equal(child1.getParent(), parent);
        assert.equal(child2.getParent(), parent);
        assert.equal(child3.getParent(), parent);
    });

    it('Node isPreExecuted() / preExecutionDone()', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);

        assert.equal(node.isPreExecuted(), false);

        node.preExecutionDone();

        assert.equal(node.isPreExecuted(), true);
    });

    it('Node isPostExecuted() / postExecutionDone()', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);

        assert.equal(node.isPostExecuted(), false);

        node.postExecutionDone();

        assert.equal(node.isPostExecuted(), true);
    });

    it('Node set/get context(): success', function () {
        const context = new Context({});
        const node = new Node(new Tag(0, "  node  ", 0), 0);

        assert.equal(node.context, null);

        node.context = context;

        assert.equal(node.context, context);
    });

    it('Node set/get context(): failure', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);

        const testFunc = function () {
            node.context = "This is not a Context";
        };

        expect(testFunc).to.throw(BadParameterError);
    });

    it('Node reset()', function () {
        const node1 = new Node(new Tag(0, "node1", 0), 0);
        const node2 = new Node(new Tag(0, "node2", 0), 0);
        const node3 = new Node(new Tag(0, "node3", 0), 0);

        node2.addParent(node1);
        node1.addNext(node3);

        node1.preExecutionDone();
        node1.postExecutionDone();

        node2.preExecutionDone();
        node2.postExecutionDone();

        const resetResult = node1.reset();

        assert.equal(node1.isPreExecuted(), false);
        assert.equal(node1.isPostExecuted(), false);

        assert.equal(node2.isPreExecuted(), false);
        assert.equal(node2.isPostExecuted(), false);

        assert.equal(resetResult, node3);
    });

    it('Node setContext()', function () {
        const context = new Context({});
        const node = new Node(new Tag(0, "  node  ", 0), 0);

        assert.equal(node.context, null);

        node.setContext(context);

        assert.equal(node.context, context);
    });

    it('Node getContextForChildren()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const context = new Context({
            value1: true,
            value2: "This is a value"
        });

        parent.setContext(context);
        const contextResult = parent.getContextForChildren();
        assert.deepEqual(contextResult, context);
        assert.equal(contextResult, context);
    });

    it('Node _fetchContext()', function () {
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const child2 = new Node(new Tag(0, "  child2  ", 0), 0);
        const child3 = new Node(new Tag(0, "  child3  ", 0), 0); //TODO why not used
        const node1 = new Node(new Tag(0, "  node1  ", 0), 0);
        const node2 = new Node(new Tag(0, "  node2  ", 0), 0);
        const context = new Context({});

        node1._fetchContext();

        assert.equal(node1.context, null);

        node1.setContext(context);

        assert.equal(node1.context, context);

        node1.addNext(node2);
        node2._fetchContext();

        assert.equal(node2.context, context);

        parent.context = context;
        child1.addParent(parent);
        child1._fetchContext();

        assert.deepEqual(child1.context, context);

        child2.addParent(parent);
        child2._fetchContext();

        assert.equal(child1.context, child2.context);
    });

    it('Node _fetchFilters()', function () {
        const previous = new Node(new Tag(0, "  previous  ", 0), 0);
        const parent = new Node(new Tag(0, "  parent  ", 0), 0);
        const child1 = new Node(new Tag(0, "  child1  ", 0), 0);
        const context = new Context({});

        previous.setContext(context);

        previous.addNext(parent);
        parent._fetchContext();
        child1.addParent(parent);

        child1._fetchContext();

        assert.deepEqual(previous.context, parent.context);
        assert.deepEqual(child1.context, parent.context);
    });

    it('Node addStep()', function () {
        const tag = new Tag(0, " ", 0);
        const node = new Node(new Tag(0, "  node  ", 0), 0);
        const testFunc = function () {
            node.addStep(tag);
        };

        expect(testFunc).to.throw(TemplateError);
    });

    it('Node _extractPipePosition() method', function () {
        const node = new Node(new Tag(0, "  node  ", 0), 0);
        assert.deepEqual(node._extractPipePosition(' "myVar | myVar" | filterName1 '), [17]);
        assert.deepEqual(node._extractPipePosition(' "myVar | myVar" | filterName1 | filterName2 '), [17, 31]);
        assert.deepEqual(node._extractPipePosition(' "myVar | myVar" | filterName1 | filterName2 '), [17, 31]);
        assert.deepEqual(node._extractPipePosition(" 'myVar | myVar' | myFilter1({value1: {value: 'this is a |'}, value2: 'This is a standalone |', value3: 23, value4: translate('something to |'), value5: variableName, value6: ['This is a string in a |', 'This is a string a |'], \"value7\": \"This is a |7\"}) | myFilter2 | myFilter3() "), [17, 255, 267]);
        assert.deepEqual(node._extractPipePosition(" 'myVar | myVar' | myFilter1({value1: {value: 'this is a |'}, value2: 'This is a standalone |', value3: 23, value4: translate('something to |'), value5: variableName, value6: ['This is a string in a |', 'This is a string a |'], \"value7\": \"This is a |7\"}) | myFilter2 | myFilter3() "), [17, 255, 267]);
    });
});