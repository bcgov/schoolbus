import React from "react";
import PropTypes from "prop-types";
import { Alert, Dropdown, ButtonToolbar, Button } from "react-bootstrap";
import { Form, FormGroup, HelpBlock, ControlLabel } from "react-bootstrap";
import { Col, Glyphicon } from "react-bootstrap";

import _ from "lodash";

import * as Api from "../api";

import CheckboxControl from "../components/CheckboxControl.jsx";
import DeleteButton from "../components/DeleteButton.jsx";
import EditButton from "../components/EditButton.jsx";
import EditDialog from "../components/EditDialog.jsx";
import FormInputControl from "../components/FormInputControl.jsx";
import RootCloseMenu from "./RootCloseMenu.jsx";

import { isBlank } from "../utils/string";

class EditFavouritesDialog extends React.Component {
  static propTypes = {
    favourite: PropTypes.object.isRequired,
    onSave: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    show: PropTypes.bool,
  };

  state = {
    name: this.props.favourite.name || "",
    isDefault: this.props.favourite.isDefault || false,
    nameError: "",
  };

  componentDidMount() {
    this.input.focus();
  }

  updateState = (state, callback) => {
    this.setState(state, callback);
  };

  didChange = () => {
    if (this.state.name !== this.props.favourite.name) {
      return true;
    }
    if (this.state.isDefault !== this.props.favourite.isDefault) {
      return true;
    }

    return false;
  };

  isValid = () => {
    if (isBlank(this.state.name)) {
      this.setState({ nameError: "Name is required" });
      return false;
    }
    return true;
  };

  onSave = () => {
    this.props.onSave({
      ...this.props.favourite,
      ...{
        name: this.state.name,
        isDefault: this.state.isDefault,
      },
    });
  };

  render() {
    return (
      <EditDialog
        id="edit-favourite"
        show={this.props.show}
        bsSize="small"
        onClose={this.props.onClose}
        onSave={this.onSave}
        didChange={this.didChange}
        isValid={this.isValid}
        title={<strong>Favourite</strong>}
      >
        <Form>
          <FormGroup
            controlId="name"
            validationState={this.state.nameError ? "error" : null}
          >
            <ControlLabel>
              Name <sup>*</sup>
            </ControlLabel>
            <FormInputControl
              type="text"
              defaultValue={this.state.name}
              updateState={this.updateState}
              inputRef={(ref) => {
                this.input = ref;
              }}
            />
            <HelpBlock>{this.state.nameError}</HelpBlock>
          </FormGroup>
          <CheckboxControl
            id="isDefault"
            checked={this.state.isDefault}
            updateState={this.updateState}
          >
            Default
          </CheckboxControl>
        </Form>
      </EditDialog>
    );
  }
}

class Favourites extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    favourites: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
    pullRight: PropTypes.bool,
  };

  state = {
    favourites: this.props.favourites,
    favouriteToEdit: {},
    showEditDialog: false,
    open: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.favourites, this.props.favourites)) {
      this.setState({ favourites: nextProps.favourites });
    }
  }

  addFavourite = () => {
    this.editFavourite({
      type: this.props.type,
      name: "",
      value: "",
      isDefault: false,
    });
  };

  editFavourite = (favourite) => {
    this.setState({ favouriteToEdit: favourite });
    this.openDialog();
  };

  saveFavourite = (favourite) => {
    // Make sure there's only one default
    if (favourite.isDefault) {
      var oldDefault = _.find(this.state.favourites, (fave) => {
        return fave.isDefault;
      });
      if (oldDefault && favourite.id !== oldDefault.id) {
        oldDefault.isDefault = false;
        Api.updateFavourite(oldDefault);
      }
    }

    if (favourite.id) {
      Api.updateFavourite(favourite);
    } else {
      favourite.value = JSON.stringify(this.props.data);
      Api.addFavourite(favourite);
    }

    this.closeDialog();
  };

  deleteFavourite = (favourite) => {
    Api.deleteFavourite(favourite);
  };

  selectFavourite = (favourite) => {
    this.toggle(false);
    this.props.onSelect(favourite);
  };

  openDialog = () => {
    this.setState({ showEditDialog: true });
  };

  closeDialog = () => {
    this.setState({ showEditDialog: false });
  };

  toggle = (open) => {
    this.setState({ open: open });
  };

  render() {
    var title = this.props.title || "Favourites";
    return (
      <Dropdown
        id={this.props.id}
        className={`favourites ${this.props.className || ""}`}
        title={title}
        pullRight={this.props.pullRight}
        open={this.state.open}
        onToggle={this.toggle}
      >
        <Dropdown.Toggle>{title}</Dropdown.Toggle>
        <RootCloseMenu bsRole="menu">
          <div className="favourites-button-bar">
            <Button onClick={this.addFavourite}>
              Favourite Current Selection
            </Button>
          </div>
          {(() => {
            if (Object.keys(this.state.favourites).length === 0) {
              return (
                <Alert bsStyle="success" style={{ marginBottom: 0 }}>
                  No favourites
                </Alert>
              );
            }

            return (
              <ul>
                {_.map(this.state.favourites, (favourite) => {
                  return (
                    <li key={favourite.id}>
                      <Col md={1}>
                        {favourite.isDefault ? <Glyphicon glyph="star" /> : ""}
                      </Col>
                      <Col md={8}>
                        <a
                          href="/#"
                          onClick={this.selectFavourite.bind(this, favourite)}
                        >
                          {favourite.name}
                        </a>
                      </Col>
                      <Col md={3}>
                        <ButtonToolbar>
                          <DeleteButton
                            name="Favourite"
                            onConfirm={this.deleteFavourite.bind(
                              this,
                              favourite
                            )}
                          />
                          <EditButton
                            name="Favourite"
                            onClick={this.editFavourite.bind(this, favourite)}
                          />
                        </ButtonToolbar>
                      </Col>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </RootCloseMenu>
        {this.state.showEditDialog ? (
          <EditFavouritesDialog
            show={this.state.showEditDialog}
            favourite={this.state.favouriteToEdit}
            onSave={this.saveFavourite}
            onClose={this.closeDialog}
          />
        ) : null}
      </Dropdown>
    );
  }
}

export default Favourites;
