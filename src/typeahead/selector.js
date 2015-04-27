/**
 * @jsx React.DOM
 */

var React = window.React || require('react/addons');
var TypeaheadOption = require('./option');

/**
 * Container for the options rendered as part of the autocompletion process
 * of the typeahead
 */
var TypeaheadSelector = React.createClass({
  propTypes: {
    options: React.PropTypes.array,
    customClasses: React.PropTypes.object,
    selectionIndex: React.PropTypes.number,
    onOptionSelected: React.PropTypes.func,
    renderOption: React.PropTypes.func.isRequired,
    getValueDisplayString: React.PropTypes.func.isRequired,
  },

  getDefaultProps: function() {
    return {
      selectionIndex: null,
      customClasses: {},
      onOptionSelected: function(option) { }
    };
  },

  getInitialState: function() {
    return {
      selectionIndex: this.props.selectionIndex,
      selection: this.getSelectionForIndex(this.props.selectionIndex)
    };
  },

  render: function() {
    var resultsClasses = {
      "typeahead-selector": true
    };
    resultsClasses[this.props.customClasses.results] = this.props.customClasses.results;
    var resultsClassList = React.addons.classSet(resultsClasses);

    var containerClasses = {
      "typeahead-selector-container": true
    };
    containerClasses[this.props.customClasses.resultsContainer] = this.props.customClasses.resultsContainer;
    var containerClassList = React.addons.classSet(containerClasses);

    var results = this.props.options.map(function(result, i) {
    var renderOption = this.props.renderOption(result);
    var displayString = this.props.getValueDisplayString(result);

      return (
        <TypeaheadOption ref={displayString} key={displayString}
          hover={this.state.selectionIndex === i}
          customClasses={this.props.customClasses}
          onClick={this._onClick.bind(this, result)}>
          { renderOption }
        </TypeaheadOption>
      );
    }, this);
    return (
      <div className={containerClassList}>
        <ul className={resultsClassList}>
          { results }
        </ul>
        { this.props.children }
      </div>
    );
  },

  setSelectionIndex: function(index) {
    this.setState({
      selectionIndex: index,
      selection: this.getSelectionForIndex(index),
    });
  },

  getSelectionForIndex: function(index) {
    if (index === null) {
      return null;
    }
    return this.props.options[index];
  },

  _onClick: function(result, event) {
    return this.props.onOptionSelected(result, event);
  },

  _nav: function(delta) {
    if (!this.props.options) {
      return;
    }
    var newIndex;
    if (this.state.selectionIndex === null) {
      if (delta == 1) {
        newIndex = 0;
      } else {
        newIndex = delta;
      }
    } else {
      newIndex = this.state.selectionIndex + delta;
    }
    if (newIndex < 0) {
      newIndex += this.props.options.length;
    } else if (newIndex >= this.props.options.length) {
      newIndex -= this.props.options.length;
    }
    var newSelection = this.getSelectionForIndex(newIndex);
    this.setState({selectionIndex: newIndex,
                   selection: newSelection});
  },

  navDown: function() {
    this._nav(1);
  },

  navUp: function() {
    this._nav(-1);
  }

});

module.exports = TypeaheadSelector;
