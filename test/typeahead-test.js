var _ = require('lodash');
var assert = require('chai').assert;
var React = require('react/addons');
var Typeahead = require('../src/typeahead');
var TypeaheadOption = require('../src/typeahead/option');
var TypeaheadSelector = require('../src/typeahead/selector');
var Keyevent = require('../src/keyevent');
var TestUtils = React.addons.TestUtils;

function simulateTextInput(component, value) {
  var node = component.refs.entry.getDOMNode();
  node.value = value;
  TestUtils.Simulate.change(node);
  return TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
}

var BEATLES = ['John', 'Paul', 'George', 'Ringo'];

var getSearchString = function(option) {
  return option.firstName + " " + option.lastName;
};
var getDisplayString = function(option) {
  return option.firstName + " (" + option.birthYear + ")";
};
var BEATLES_COMPLEX = [
  {
    firstName: 'John',
    lastName: 'Lennon',
    birthYear: 1940
  },
  {
    firstName: 'Paul',
    lastName: 'McCartney',
    birthYear: 1942
  },
  {
    firstName: 'George',
    lastName: 'Harrison',
    birthYear: 1943
  },
  {
    firstName: 'Ringo',
    lastName: 'Starr',
    birthYear: 1940
  }
];

describe('Typeahead Component', function() {

  describe('sanity', function() {
    beforeEach(function() {
      this.component = TestUtils.renderIntoDocument(<Typeahead options={
        BEATLES
      } />);
    });

    it('should fuzzy search and render matching results', function() {
      // input value: num of expected results
      var testplan = {
        'o': 3,
        'pa': 1,
        'Grg': 1,
        'Ringo': 1,
        'xxx': 0
      };

      _.each(testplan, function(expected, value) {
        var results = simulateTextInput(this.component, value);
        assert.equal(results.length, expected, 'Text input: ' + value);
      }, this);
    });

    describe('keyboard controls', function() {
      it('down arrow + return selects an option', function() {
        var results = simulateTextInput(this.component, 'o');
        var secondItem = results[1].getDOMNode().innerText;
        var node = this.component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_RETURN });
        assert.equal(node.value, secondItem); // Poor Ringo
      });

      it('up arrow + return navigates and selects an option', function() {
        var results = simulateTextInput(this.component, 'o');
        var firstItem = results[0].getDOMNode().innerText;
        var node = this.component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_UP });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_RETURN });
        assert.equal(node.value, firstItem);
      });

      it('escape clears selection', function() {
        var results = simulateTextInput(this.component, 'o');
        var firstItem = results[0].getDOMNode();
        var node = this.component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        assert.ok(firstItem.classList.contains('hover'));
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_ESCAPE });
        assert.notOk(firstItem.classList.contains('hover'));
      });

      it('tab to choose first item', function() {
        var results = simulateTextInput(this.component, 'o');
        var itemText = results[0].getDOMNode().innerText;
        var node = this.component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_TAB });
        assert.equal(node.value, itemText);
      });

      it('tab to selected current item', function() {
        var results = simulateTextInput(this.component, 'o');
        var itemText = results[1].getDOMNode().innerText;
        var node = this.component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_DOWN });
        TestUtils.Simulate.keyDown(node, { keyCode: Keyevent.DOM_VK_TAB });
        assert.equal(node.value, itemText);
      });
    });

  });

  describe('props', function() {
    context('maxVisible', function() {
      it('limits the result set based on the maxVisible option', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          maxVisible={ 1 }
        />);
        var results = simulateTextInput(component, 'o');
        assert.equal(results.length, 1);
      });
    });

    context('options', function() {
      it('renders simple options correctly', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
        />);
        var results = simulateTextInput(component, 'john');
        assert.equal(results[0].getDOMNode().textContent, 'John');
      });

      it('renders custom options correctly', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES_COMPLEX }
          getDisplayString={ getDisplayString }
          getSearchString={ getSearchString }
        />);
        var results = simulateTextInput(component, 'john');
        assert.equal(results[0].getDOMNode().textContent, 'John (1940)');
      });

      it('filters search string', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES_COMPLEX }
          getDisplayString={ getDisplayString }
          getSearchString={ getSearchString }
        />);
        var results = simulateTextInput(component, 'Lennon');
        assert.equal(results[0].getDOMNode().textContent, 'John (1940)');
      });
    });

    context('onNewVisibleOptions', function() {
      it('calls the provided callback exactly once', function() {
        var callCounter = 0;
        var onNewVisibleOptions = function() {
          callCounter++;
        };

        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          onNewVisibleOptions={ onNewVisibleOptions }
        />);

        assert.equal(callCounter, 1);
        var results = simulateTextInput(component, 'john');
        assert.equal(callCounter, 2);
      });

      it('calls the provided callback with the correct parameters', function() {
        var entryValue, visibleOptions;
        var onNewVisibleOptions = function(_entryValue, _visibleOptions) {
          entryValue = _entryValue;
          visibleOptions = _visibleOptions;
        };

        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          onNewVisibleOptions={ onNewVisibleOptions }
        />);

        var results = simulateTextInput(component, 'john');
        assert.equal(entryValue, 'john');
        assert.equal(visibleOptions.length, 1);
        assert.deepEqual(visibleOptions, ['John']);
      });
    });

    context('custom filterOptions function', function() {
      it('works with a custom function', function() {
        var callCounter = 0;
        var filterOptions = function(query, options, getSearchString) {
          callCounter++;
          if (callCounter === 1) {
            assert.equal(query, '');
            assert.deepEqual(options, BEATLES);
            return options;
          }

          assert.equal(query, 'John');
          var results = options.filter(function(option) {
            return getSearchString(option) === 'George';
          });

          assert.equal(results.length, 1);
          assert.equal(results[0] , 'George');

          return results;
        };

        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          filterOptions={ filterOptions }
        />);

        var results = simulateTextInput(component, 'John');
        assert.equal(results.length, 1);
        assert.equal(results[0].getDOMNode().textContent, 'George');
      });
    });

    context('customClasses', function() {

      before(function() {
        var customClasses = {
          input: 'topcoat-text-input',
          resultsContainer: 'foo',
          results: 'topcoat-list__container',
          listItem: 'topcoat-list__item',
          listAnchor: 'topcoat-list__link'
        };

        this.component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          customClasses={ customClasses }
        />);

        simulateTextInput(this.component, 'o');
      });

      it('adds a custom class to the typeahead input', function() {
        var input = this.component.refs.entry.getDOMNode();
        assert.isTrue(input.classList.contains('topcoat-text-input'));
      });

      it('adds a custom class to the results container component', function() {
        var resultsContainer = TestUtils.findRenderedComponentWithType(this.component, TypeaheadSelector).getDOMNode();
        assert.isTrue(resultsContainer.classList.contains('foo'));
      });

      it('adds a custom class to the results component', function() {
        var results = TestUtils.findRenderedComponentWithType(this.component, TypeaheadSelector).getDOMNode().firstChild;
        assert.isTrue(results.classList.contains('topcoat-list__container'));
      });

      it('adds a custom class to the list items', function() {
        var typeaheadOptions = TestUtils.scryRenderedComponentsWithType(this.component, TypeaheadOption);
        var listItem = typeaheadOptions[1].getDOMNode();
        assert.isTrue(listItem.classList.contains('topcoat-list__item'));
      });

      it('adds a custom class to the option anchor tags', function() {
        var typeaheadOptions = TestUtils.scryRenderedComponentsWithType(this.component, TypeaheadOption);
        var listAnchor = typeaheadOptions[1].refs.anchor.getDOMNode();
        assert.isTrue(listAnchor.classList.contains('topcoat-list__link'));
      });
    });

    context('defaultValue', function() {
      it('should perform an initial search if a default value is provided', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          defaultValue={ 'o' }
        />);

        var results = TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
        assert.equal(results.length, 3);
      });
    });

    context('onKeyDown', function() {
      it('should bind to key events on the input', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          onKeyDown={ function(e) {
              assert.equal(e.keyCode, 87);
            }
          }
        />);

        var input = component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(input, { keyCode: 87 });
      });
    });

    context('onChange', function() {
      it('should bind to onChange events on the input', function() {
        var component = TestUtils.renderIntoDocument(<Typeahead
          options={ BEATLES }
          onChange={ function(e) {
              assert.equal(e.keyCode, 87);
            }
          }
        />);

        var input = component.refs.entry.getDOMNode();
        TestUtils.Simulate.keyDown(input, { keyCode: 87 });
      });
    });
  });



});
