import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";

import { Grid, Row, Col } from "react-bootstrap";
import { Form, FormGroup, ControlLabel, HelpBlock } from "react-bootstrap";

import _ from "lodash";
import Moment from "moment";

import * as Api from "../../api";
import * as Constant from "../../constants";

import DateControl from "../../components/DateControl.jsx";
import DropdownControl from "../../components/DropdownControl.jsx";
import EditDialog from "../../components/EditDialog.jsx";
import FilterDropdown from "../../components/FilterDropdown.jsx";
import FormInputControl from "../../components/FormInputControl.jsx";
import Spinner from "../../components/Spinner.jsx";

import {
  today,
  businessDayOnOrBefore,
  daysFromToday,
  isValidDate,
  toZuluTime,
} from "../../utils/date";
import { isBlank } from "../../utils/string";

class InspectionEditDialog extends React.Component {
  static propTypes = {
    inspection: PropTypes.object.isRequired,
    inspectors: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    show: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    var isNew = props.inspection.id === 0;

    this.state = {
      loading: false,

      inspectorId: props.inspection.inspector
        ? props.inspection.inspector.id
        : 0,
      inspectionDate: props.inspection.inspectionDate || today(),
      inspectionTypeCode:
        props.inspection.inspectionTypeCode ||
        Constant.INSPECTION_TYPE_ANNUAL,
      inspectionResultCode: props.inspection.inspectionResultCode || "",
      nextInspectionDate: isNew
        ? ""
        : props.inspection.schoolBus
        ? props.inspection.schoolBus.nextInspectionDate
        : "",
      nextInspectionTypeCode: isNew
        ? ""
        : props.inspection.schoolBus
        ? props.inspection.schoolBus.nextInspectionTypeCode
        : "",
      notes: props.inspection.notes || "",
      ripInspectionId: props.inspection.ripInspectionId || "",

      inspectionDateError: false,
      inspectorIdError: false,
      inspectionResultCodeError: false,
      nextInspectionDateError: false,
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    Api.getInspectors().finally(() => {
      this.setState({ loading: false });
    });
  }

  updateState = (state, callback) => {
    this.setState(state, callback);
  };

  updateNextInspectionDate = () => {
    var inspectionDate = Moment(this.state.inspectionDate);
    if (inspectionDate && inspectionDate.isValid()) {
      // Remove time elements from date
      inspectionDate.startOf("d");
      var nextDate = "";
      if (
        this.state.inspectionResultCode === Constant.INSPECTION_RESULT_FAILED
      ) {
        // 30 days from date
        nextDate = businessDayOnOrBefore(inspectionDate.add(30, "d"));
      } else if (
        this.state.inspectionResultCode === Constant.INSPECTION_RESULT_PASSED
      ) {
        // A year from date
        nextDate = businessDayOnOrBefore(inspectionDate.add(1, "y"));
      } else if (
        this.state.inspectionResultCode ===
        Constant.INSPECTION_RESULT_OUT_OF_SERVICE
      ) {
        // Clear the date
        nextDate = "";
      }

      this.updateState({ nextInspectionDate: nextDate });
    }
  };

  inspectionDateChanged = (date) => {
    this.updateState(
      {
        inspectionDate: date,
      },
      this.updateNextInspectionDate
    );
  };

  resultCodeChanged = (resultCode) => {
    var typeCode = "";

    if (
      resultCode === Constant.INSPECTION_RESULT_FAILED ||
      resultCode === Constant.INSPECTION_RESULT_OUT_OF_SERVICE
    ) {
      typeCode = Constant.INSPECTION_TYPE_REINSPECTION;
    } else if (resultCode === Constant.INSPECTION_RESULT_PASSED) {
      typeCode = Constant.INSPECTION_TYPE_ANNUAL;
    }

    this.updateState(
      {
        inspectionResultCode: resultCode,
        nextInspectionTypeCode: typeCode,
      },
      this.updateNextInspectionDate
    );
  };

  didChange = () => {
    if (
      this.state.inspectorId !==
      (this.props.inspection.inspector
        ? this.props.inspection.inspector.id
        : "")
    ) {
      return true;
    }
    if (this.state.inspectionDate !== this.props.inspection.inspectionDate) {
      return true;
    }
    if (
      this.state.inspectionTypeCode !== this.props.inspection.inspectionTypeCode
    ) {
      return true;
    }
    if (
      this.state.inspectionResultCode !==
      this.props.inspection.inspectionResultCode
    ) {
      return true;
    }
    if (
      this.state.nextInspectionDate !== this.props.inspection.nextInspectionDate
    ) {
      return true;
    }
    if (
      this.state.nextInspectionTypeCode !==
      this.props.inspection.nextInspectionTypeCode
    ) {
      return true;
    }
    if (this.state.notes !== this.props.inspection.notes) {
      return true;
    }
    if (this.state.ripInspectionId !== this.props.inspection.ripInspectionId) {
      return true;
    }

    return false;
  };

  isValid = () => {
    this.setState({
      inspectionDateError: false,
      inspectorIdError: false,
      inspectionResultCodeError: false,
      nextInspectionDateError: false,
    });

    var valid = true;
    if (isBlank(this.state.inspectionDate)) {
      this.setState({ inspectionDateError: "Inspection date is required" });
      valid = false;
    } else if (!isValidDate(this.state.inspectionDate)) {
      this.setState({ inspectionDateError: "Inspection date not valid" });
      valid = false;
    } else if (daysFromToday(this.state.inspectionDate) > 0) {
      this.setState({
        inspectionDateError: "Inspection date must be today or earlier",
      });
      valid = false;
    }

    if (isBlank(this.state.inspectorId)) {
      this.setState({ inspectorIdError: "Inspector is required" });
      valid = false;
    }

    if (isBlank(this.state.inspectionResultCode)) {
      this.setState({ inspectionResultCodeError: "Result is required" });
      valid = false;
    }

    if (isBlank(this.state.nextInspectionDate)) {
      this.setState({
        nextInspectionDateError: "Next inspection date is required",
      });
      valid = false;
    } else if (!isValidDate(this.state.nextInspectionDate)) {
      this.setState({
        nextInspectionDateError: "Next inspection date not valid",
      });
      valid = false;
    } else if (isValidDate(this.state.inspectionDate)) {
      // Remove time elements from dates so day/month/year math works.
      var inspectionDate = Moment(this.state.inspectionDate).startOf("d");
      var nextInspectionDate = Moment(this.state.nextInspectionDate).startOf(
        "d"
      );
      if (
        this.state.nextInspectionTypeCode ===
        Constant.INSPECTION_TYPE_REINSPECTION
      ) {
        var diff = nextInspectionDate.diff(inspectionDate, "d");
        if (diff <= 0) {
          // Cannot be before or on the date of the inspection.
          this.setState({
            nextInspectionDateError: "Re-inspection must be after inspection",
          });
          valid = false;
        } else if (diff > 30) {
          // Cannot be more than 30 days from the date of the inspection.
          this.setState({
            nextInspectionDateError:
              "Re-inspection must be within 30 days of inspection",
          });
          valid = false;
        }
      } else if (
        this.state.nextInspectionTypeCode === Constant.INSPECTION_TYPE_ANNUAL
      ) {
        if (nextInspectionDate.diff(inspectionDate, "M") < 9) {
          // Cannot be less than 9 months from the date of the inspection,
          this.setState({
            nextInspectionDateError:
              "Annual inspection must be at least 9 months after inspection",
          });
          valid = false;
        } else if (
          nextInspectionDate.subtract(1, "d").diff(inspectionDate, "y") > 0
        ) {
          // Cannot be more than the one year from the Date of the Inspection.
          this.setState({
            nextInspectionDateError:
              "Annual inspection must be within a year of inspection",
          });
          valid = false;
        }
      }
    }

    return valid;
  };

  onSave = () => {
    this.props.onSave({
      ...this.props.inspection,
      ...{
        inspector: { id: this.state.inspectorId },
        inspectionDate: toZuluTime(this.state.inspectionDate),
        inspectionTypeCode: this.state.inspectionTypeCode,
        inspectionResultCode: this.state.inspectionResultCode,
        nextInspectionDate: toZuluTime(this.state.nextInspectionDate),
        nextInspectionTypeCode: this.state.nextInspectionTypeCode,
        notes: this.state.notes,
        ripInspectionId: this.state.ripInspectionId,
      },
    });
  };

  render() {
    var inspectors = _.sortBy(this.props.inspectors, "name");

    // Read-only if the user cannot edit the inspection
    var isReadOnly =
      !this.props.inspection.canEdit && this.props.inspection.id !== 0;

    return (
      <EditDialog
        id="inspection-edit"
        show={this.props.show}
        readOnly={isReadOnly}
        onClose={this.props.onClose}
        onSave={this.onSave}
        didChange={this.didChange}
        isValid={this.isValid}
        title={<strong>Inspection</strong>}
      >
        {(() => {
          if (this.state.loading) {
            return (
              <div style={{ textAlign: "center" }}>
                <Spinner />
              </div>
            );
          }

          return (
            <Form>
              <Grid fluid>
                <Row>
                  <Col md={4}>
                    <FormGroup
                      validationState={
                        this.state.inspectionDateError ? "error" : null
                      }
                    >
                      <ControlLabel>
                        Date <sup>*</sup>
                      </ControlLabel>
                      <DateControl
                        id="inspectionDate"
                        date={this.state.inspectionDate}
                        disabled={isReadOnly}
                        onChange={this.inspectionDateChanged}
                        placeholder="mm/dd/yyyy"
                        title="inspection date"
                      />
                      <HelpBlock>{this.state.inspectionDateError}</HelpBlock>
                    </FormGroup>
                  </Col>
                  <Col md={5}>
                    <FormGroup
                      controlId="inspectorId"
                      validationState={
                        this.state.inspectorIdError ? "error" : null
                      }
                    >
                      <ControlLabel>
                        Inspector <sup>*</sup>
                      </ControlLabel>
                      <FilterDropdown
                        id="inspectorId"
                        placeholder="None"
                        blankLine
                        disabled={isReadOnly}
                        items={inspectors}
                        selectedId={this.state.inspectorId}
                        updateState={this.updateState}
                      />
                      <HelpBlock>{this.state.inspectorIdError}</HelpBlock>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup
                      controlId="inspectionResultCode"
                      validationState={
                        this.state.inspectionResultCodeError ? "error" : null
                      }
                    >
                      <ControlLabel>
                        Result <sup>*</sup>
                      </ControlLabel>
                      <DropdownControl
                        id="inspectionResultCode"
                        title={this.state.inspectionResultCode}
                        disabled={isReadOnly}
                        onSelect={this.resultCodeChanged}
                        placeholder="None"
                        blankLine
                        items={[
                          Constant.INSPECTION_RESULT_PASSED,
                          Constant.INSPECTION_RESULT_FAILED,
                          Constant.INSPECTION_RESULT_OUT_OF_SERVICE,
                        ]}
                      />
                      <HelpBlock>
                        {this.state.inspectionResultCodeError}
                      </HelpBlock>
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <FormGroup
                      validationState={
                        this.state.nextInspectionDateError ? "error" : null
                      }
                    >
                      <ControlLabel>
                        Next Inspection Date <sup>*</sup>
                      </ControlLabel>
                      <DateControl
                        id="nextInspectionDate"
                        date={this.state.nextInspectionDate}
                        disabled={isReadOnly}
                        updateState={this.updateState}
                        placeholder="mm/dd/yyyy"
                        title="next inspection date"
                      />
                      <HelpBlock>
                        {this.state.nextInspectionDateError}
                      </HelpBlock>
                    </FormGroup>
                    <FormGroup controlId="ripInspectionId">
                      <ControlLabel>RIP Inspection ID</ControlLabel>
                      <FormInputControl
                        type="text"
                        defaultValue={this.state.ripInspectionId}
                        disabled={isReadOnly}
                        updateState={this.updateState}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={8}>
                    <FormGroup controlId="notes">
                      <ControlLabel>Comments</ControlLabel>
                      <FormInputControl
                        componentClass="textarea"
                        value={this.state.notes}
                        readOnly={isReadOnly}
                        updateState={this.updateState}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </Grid>
            </Form>
          );
        })()}
      </EditDialog>
    );
  }
}

function mapStateToProps(state) {
  return {
    inspectors: state.lookups.inspectors,
  };
}

export default connect(mapStateToProps)(InspectionEditDialog);
