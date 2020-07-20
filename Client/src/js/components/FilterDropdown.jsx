import React from "react";
import PropTypes from "prop-types";

import { Well, Dropdown, FormControl, MenuItem } from "react-bootstrap";

import RootCloseMenu from "./RootCloseMenu.jsx";

import _ from "lodash";

class FilterDropdown extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    selectedId: PropTypes.number,
    className: PropTypes.string,
    // Assumes the 'name' field unless specified here.
    fieldName: PropTypes.string,
    placeholder: PropTypes.string,
    // If blankLine is supplied, include an "empty" line at the top;
    // If it has a string value, use that in place of blank.
    blankLine: PropTypes.any,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func,
    updateState: PropTypes.func,
  };

  state = {
    selectedId: this.props.selectedId || 0,
    title: "",
    filterTerm: "",
    fieldName: this.props.fieldName || "name",
    open: false,
  };

  componentDidMount() {
    // Have to wait until state is ready before initializing title.
    var title = this.buildTitle(this.props.items, this.state.selectedId);
    this.setState({ title: title });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.items, this.props.items)) {
      var items = nextProps.items || [];
      this.setState({
        items: items,
        title: this.buildTitle(items, this.state.selectedId),
      });
    } else if (nextProps.selectedId !== this.props.selectedId) {
      this.setState({
        selectedId: nextProps.selectedId,
        title: this.buildTitle(this.props.items, nextProps.selectedId),
      });
    }
  }

  buildTitle = (items, selectedId) => {
    if (selectedId) {
      var selected = _.find(items, { id: selectedId });
      if (selected) {
        return selected[this.state.fieldName];
      }
    }
    return this.props.placeholder || "Select item";
  };

  itemSelected = (selectedId) => {
    this.toggle(false);

    this.setState({
      selectedId: selectedId || "",
      title: this.buildTitle(this.props.items, selectedId),
    });

    this.sendSelected(selectedId);
  };

  sendSelected = (selectedId) => {
    var selected = _.find(this.props.items, { id: selectedId });

    // Send selected item to change listener
    if (this.props.onSelect) {
      this.props.onSelect(selected, this.props.id);
    }

    // Update state with selected Id
    if (this.props.updateState) {
      this.props.updateState({
        [this.props.id]: selectedId,
      });
    }
  };

  toggle = (open) => {
    this.setState(
      {
        open: open,
        filterTerm: "",
      },
      () => {
        if (open) {
          this.input.focus();
          this.input.value = "";
        }
      }
    );
  };

  filter = (e) => {
    this.setState({
      filterTerm: e.target.value.toLowerCase().trim(),
    });
  };

  render() {
    var items = this.props.items;

    if (this.state.filterTerm.length > 0) {
      items = _.filter(items, (item) => {
        return (
          item[this.state.fieldName]
            .toLowerCase()
            .indexOf(this.state.filterTerm) !== -1
        );
      });
    }

    return (
      <Dropdown
        className={`filter-dropdown ${this.props.className || ""}`}
        id={this.props.id}
        title={this.state.title}
        disabled={this.props.disabled}
        open={this.state.open}
        onToggle={this.toggle}
      >
        <Dropdown.Toggle title={this.state.title} />
        <RootCloseMenu bsRole="menu">
          <Well bsSize="small">
            <FormControl
              type="text"
              placeholder="Search"
              onChange={this.filter}
              inputRef={(ref) => {
                this.input = ref;
              }}
            />
          </Well>
          {items.length > 0 && (
            <ul>
              {this.props.blankLine && this.state.filterTerm.length === 0 && (
                <MenuItem key={0} eventKey={0} onSelect={this.itemSelected}>
                  {typeof this.props.blankLine === "string"
                    ? this.props.blankLine
                    : " "}
                </MenuItem>
              )}
              {_.map(items, (item) => {
                return (
                  <MenuItem
                    key={item.id}
                    eventKey={item.id}
                    onSelect={this.itemSelected}
                  >
                    {item[this.state.fieldName]}
                  </MenuItem>
                );
              })}
            </ul>
          )}
        </RootCloseMenu>
      </Dropdown>
    );
  }
}

export default FilterDropdown;
