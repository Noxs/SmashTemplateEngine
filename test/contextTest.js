const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const Context = require('../lib/context.js');


describe('Context', function () {
    it('Context build : Success', function () {
        const test = {
            year : 2017,
            day : "Tuesday",
        };
        const context = new Context(test);
        assert.isObject(context);
        assert.isFunction(context.byString);
        assert.isFunction(context.copy);
        assert.equal(context.year, 2017);
        assert.equal(context.day, "Tuesday");
        assert.equal(context.test, undefined);
        const successFunc = function() {
            new Context(test);
        };
        expect(successFunc).to.not.throw(Error);
    });

    it('Context build : First parameter is a string', function () {
        const failureFunc = function() {
            new Context('Wrong type');
        };
        expect(failureFunc).to.throw(Error);
    });

    it('Context byString() method : Success', function () {
        const test = {
            year : 2017,
            day : "Tuesday",
        };
        const context = new Context(test);
        expect(context.byString("year")).to.equal(2017);
        expect(context.byString("day")).to.equal("Tuesday");
    });

    it('Context byString() method : Success with nested context', function () {
        const nestedTest = {
            sports : {
                handball : {
                    place : 'indoor',
                    team : 7,
                }
            },
        };
        const context = new Context(nestedTest);
        expect(context.byString('sports.handball.place')).to.equal('indoor');
        expect(context.byString('sports.handball.team')).to.equal(7);
    });

    it('Context byString() method : First parameter is an object', function () {
        const test = {
            year : 2017,
            day : "Tuesday",
        };
        const context = new Context(test);
        const firstParameterObjectFunc = function () {
            context.byString({});
        };
        expect(firstParameterObjectFunc).to.throw(Error);
    });

    it('Context copy() method : Success', function () {
        const test = {
            year : 2017,
            day : "Tuesday",
        };
        const context = new Context(test);
        const copy = context.copy();
        assert.deepEqual(copy, context);

        context.test = 'new value';
        assert.isUndefined(copy.test);
        const successFunc = function () {
            context.copy();
        };
        expect(successFunc).to.not.throw(Error);
    });


});