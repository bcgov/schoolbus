import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import EditDialog from "../../components/EditDialog.jsx";
import FormInputControl from "../../components/FormInputControl.jsx";
import Spinner from "../../components/Spinner.jsx";
import {
  Form,
  FormGroup,
  Grid,
  Well,
  Row,
  Col,
  ControlLabel,
  HelpBlock,
} from "react-bootstrap";
import {
  Editor,
  EditorState,
  ContentState,
  RichUtils,
  convertFromHTML,
} from "draft-js";
import {
  registerCopySource,
  handleDraftEditorPastedText,
} from "draftjs-conductor"; //copy-pasted between Draft.js editor
import { convertToHTML } from "draft-convert";
import { formatDateTime } from "../../utils/date";
import { isBlank } from "../../utils/string";

import * as Constant from "../../constants";
import * as Api from "../../api";
import _ from "lodash";

class SchoolBusesEmailDialog extends React.Component {
  static propTypes = {
    currentUser: PropTypes.object.isRequired,
    schoolBuses: PropTypes.object.isRequired,
    show: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    email: PropTypes.object,

    owner: PropTypes.object.isRequired,
    ui: PropTypes.object,
  };

  state = {
    loadData: true,
    loadEmail: true,
    loadLastInspectionDate: true,

    editorState: EditorState.createEmpty(),
    schoolBuses: this.props.schoolBuses ? this.props.schoolBuses : null,
    mailFrom:
      this.props.currentUser && this.props.currentUser.email
        ? this.props.currentUser.email
        : "",
    mailTo: "",
    mailCc: "",
    subject: "",
    body: "",

    mailToError: false,
    mailCcError: false,
    subjectError: false,

    lastInspectionDates: {}, //last inspection date of school buses

    ui: {
      sortField: this.props.ui.sortField,
      sortDesc: this.props.ui.sortDesc,
    },
  };

  componemtWillMount = () => {
    if (this.copySource) {
      this.copySource.unregister();
    }
  };

  componentDidMount() {
    this.setState({ loadData: true });

    //if user retry sending email
    if (!_.isEmpty(this.props.email)) {
      var email = _.omit(this.props.email, ["errorInfo", "mailSent"]);
      const blocksFromHTML = convertFromHTML(email.body);
      const state = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return this.setState({
        mailTo: email.mailTo,
        mailCc: email.mailCc,
        subject: email.subject,
        editorState: EditorState.createWithContent(state),
        loadData: false,
      });
    }

    this.fetchEmailAddress();
    this.fetchLastInspectionDate();

    if (this.editorRef != null) {
      this.copySource = registerCopySource(this.editorRef);
    }
  }

  fetchEmailAddress = () => {
    this.setState({ loadEmail: true });
    var primaryContactIds = []; //Array store all primary contact id of owners who related to search result of school buses
    var emailAddresses = [];
    var count = 0;
    _.map(this.state.schoolBuses, (bus) => {
      if (bus.schoolBusOwner && bus.schoolBusOwner.primaryContactId) {
        primaryContactIds.push(bus.schoolBusOwner.primaryContactId);
      }
    });
    primaryContactIds = _.uniq(primaryContactIds); //remove duplicated id

    if (primaryContactIds.length > 0) {
      //get primary contacts
      _.map(primaryContactIds, (id) => {
        Api.getContact(id).then((response) => {
          if (response.emailAddress !== null && response.emailAddress !== "") {
            emailAddresses.push(response.emailAddress);
          }
          count++;
          if (count === primaryContactIds.length) {
            this.setState(
              {
                subject: "Request School Bus Inspection ",
                mailTo: emailAddresses.join("; "),
                loadEmail: false,
              },
              () => {
                if (!this.state.loadLastInspectionDate) {
                  this.populateBody();
                }
              }
            );
          }
        });
      });
    } else {
      this.setState(
        {
          subject: "Request School Bus Inspection ",
          loadEmail: false,
        },
        () => {
          if (!this.state.loadLastInspectionDate) {
            this.populateBody();
          }
        }
      );
    }
  };

  fetchLastInspectionDate = () => {
    this.setState({ loadLastInspectionDate: true });
    var count = 0;
    var schoolBuses = _.sortBy(this.state.schoolBuses, this.state.ui.sortField);
    if (this.state.ui.sortDesc) {
      _.reverse(schoolBuses);
    }
    if (schoolBuses.length > 0) {
      _.map(schoolBuses, (bus) => {
        Api.getSchoolBusInspections(bus.id).then((inspections) => {
          //callback of inspections belong to a school bus
          this.findLastInspectionDate(inspections);
          count++;
          if (count === schoolBuses.length) {
            this.setState(
              {
                loadLastInspectionDate: false,
              },
              () => {
                if (!this.state.loadEmail) {
                  this.populateBody();
                }
              }
            );
          }
        });
      });
    } else {
      this.setState(
        {
          loadLastInspectionDate: false,
        },
        () => {
          if (!this.state.loadEmail) {
            this.populateBody();
          }
        }
      );
    }
  };

  findLastInspectionDate = (inspections) => {
    if (!_.isEmpty(inspections)) {
      var schoolBuses = this.state.schoolBuses;
      var lastInspectionDate = []; //last inspection date of a school bus
      var bus = _.find(inspections, "schoolBus");
      var busId = bus.schoolBus.id;
      _.map(inspections, (inspection) => {
        lastInspectionDate.push(inspection.inspectionDate);
      });
      lastInspectionDate.sort();
      schoolBuses[busId].lastInspectionDate =
        lastInspectionDate[lastInspectionDate.length - 1];
      this.setState({
        schoolBuses: schoolBuses,
      });
    }
  };

  populateBody = () => {
    var schoolBuses = _.sortBy(this.state.schoolBuses, this.state.ui.sortField);
    if (this.state.ui.sortDesc) {
      _.reverse(schoolBuses);
    }

    var text = "<b><u>School Bus List:</u></b>";
    var body =
      "<p>According to CVSE records, the following school bus(es) are due or overdue for a re-inspection or annual mechanical school bus compliance inspection.<br></p>";
    body +=
      "<p>Please review the following list and advise if there are any changes required.<br>";
    body +=
      "Please contact me so that we may arrange a time and location for the inspection(s) to take place.<br></p>";
    body += "<p>Regards,<br>";
    body += this.props.currentUser.fullName + "<br></p>";
    body += "<p>" + text + "<br></p>";
    _.map(schoolBuses, (bus) => {
      body += "<p>*Owner: " + bus.ownerName + "–<br>";
      body +=
        "Last Inspection Date: " +
        (bus.lastInspectionDate
          ? formatDateTime(
              bus.lastInspectionDate,
              Constant.DATE_SHORT_MONTH_DAY_YEAR
            )
          : "null");
      body +=
        "<ul><li>Registration: " +
        (bus.icbcRegistrationNumber ? bus.icbcRegistrationNumber : "null") +
        "</li>";
      body +=
        "<li>Plate Number: " +
        (bus.licencePlateNumber ? bus.licencePlateNumber : "null") +
        "</li>";
      body +=
        "<li>Unit Number: " +
        (bus.unitNumber ? bus.unitNumber : "null") +
        "</li>";
      body +=
        "<li>Permit: " +
        (bus.permitNumber ? bus.permitNumber : "null") +
        "</li>";
      return (body +=
        "<li>Home Terminal: " +
        (bus.homeTerminalCityPostal ? bus.homeTerminalCityPostal : "null") +
        "</li></ul><br></p>");
    });
    const blocksFromHTML = convertFromHTML(body);
    const state = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap
    );
    this.setState({
      editorState: EditorState.createWithContent(state),
      loadData: false,
    });
  };

  updateState = (state, callback) => {
    this.setState(state, callback);
  };

  onChange = (editorState) => {
    this.setState({ editorState: editorState });
  };

  handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(
      this.state.editorState,
      command
    );
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  };

  handlePastedText = (text, html) => {
    let newState = handleDraftEditorPastedText(html, this.state.editorState);

    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  };

  _onBoldClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, "BOLD"));
  };

  _onItalicClick = () => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, "ITALIC")
    );
  };

  _onUnderlineClick = () => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, "UNDERLINE")
    );
  };

  onSave = () => {
    var content = this.state.editorState.getCurrentContent();
    content = convertToHTML({
      blockToHTML: (block) => {
        switch (block.type) {
          case "unstyled":
            if (block.text === " " || block.text === "") {
              return <br />;
            }
            break;
          default:
            break;
        }
      },
    })(content);
    var email = {
      userName: this.props.currentUser.name,
      mailFrom: this.state.mailFrom,
      mailTo: this.state.mailTo,
      mailCc: this.state.mailCc,
      subject: this.state.subject,
      body: content,
    };
    this.props.onSave(email);
  };

  didChange = () => {
    return true;
  };

  isValid = () => {
    var isValid = true;
    var re = RegExp(
      /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
    );

    this.setState({
      mailToError: false,
      mailCcError: false,
      subjectError: false,
    });

    if (isBlank(this.state.mailTo)) {
      this.setState({ mailToError: "Email address is required." });
      isValid = false;
    } else {
      var mailTos = this.state.mailTo.split(/[;, ]/);
      var invalidMailTo = [];
      //remove empty string and find out invalid email
      for (var a in mailTos) {
        if (mailTos[a] !== "" && !re.test(mailTos[a])) {
          invalidMailTo.push(mailTos[a]);
        }
      }
      //check if invalid email exist
      if (invalidMailTo.length > 0) {
        this.setState({
          mailToError:
            "Email address in invalid format: " + invalidMailTo.join(", "),
        });
        isValid = false;
      }
    }

    if (!isBlank(this.state.mailCc)) {
      var mailCcs = this.state.mailCc.split(/[;, ]/);
      var invalidMailCc = [];
      //remove empty string and find out invalid email
      for (var b in mailCcs) {
        if (mailCcs[b] !== "" && !re.test(mailCcs[b])) {
          invalidMailCc.push(mailCcs[b]);
        }
      }
      //check if invalid email exist
      if (invalidMailCc.length > 0) {
        this.setState({
          mailCcError:
            "Email address in invalid format: " + invalidMailCc.join(", "),
        });
        isValid = false;
      }
    }

    if (isBlank(this.state.subject)) {
      this.setState({ subjectError: "Email subject is required." });
      isValid = false;
    }

    return isValid;
  };

  render() {
    return (
      <div>
        <EditDialog
          title={<strong>Email to School Bus Owner</strong>}
          didChange={this.didChange}
          isValid={this.isValid}
          onSave={this.onSave}
          onClose={this.props.onClose}
          show={this.props.show}
          saveText={"Send"}
        >
          {(() => {
            if (this.state.loadData) {
              return (
                <div style={{ textAlign: "center" }}>
                  <Spinner />
                </div>
              );
            }

            return (
              <Form>
                <Grid fluid>
                  <Well>
                    <Row>
                      <Col md={12}>
                        <FormGroup
                          controlId="mailTo"
                          validationState={
                            this.state.mailToError ? "error" : null
                          }
                        >
                          <ControlLabel>
                            Email <sup>*</sup>
                          </ControlLabel>
                          <span style={{ fontSize: "12px" }}>
                            {" "}
                            (Use ; to separate addresses)
                          </span>
                          <FormInputControl
                            type="text"
                            defaultValue={this.state.mailTo}
                            placeholder="example@email.com;"
                            updateState={this.updateState}
                          />
                          <HelpBlock>{this.state.mailToError}</HelpBlock>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <FormGroup
                          controlId="mailCc"
                          validationState={
                            this.state.mailCcError ? "error" : null
                          }
                        >
                          <ControlLabel>CC </ControlLabel>
                          <span style={{ fontSize: "12px" }}>
                            {" "}
                            (Use ; to separate addresses)
                          </span>
                          <FormInputControl
                            type="text"
                            defaultValue={this.state.mailCc}
                            placeholder="example@email.com;"
                            updateState={this.updateState}
                          />
                          <HelpBlock>{this.state.mailCcError}</HelpBlock>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <FormGroup
                          controlId="subject"
                          validationState={
                            this.state.subjectError ? "error" : null
                          }
                        >
                          <ControlLabel>
                            Subject <sup>*</sup>
                          </ControlLabel>
                          <FormInputControl
                            type="text"
                            defaultValue={this.state.subject}
                            placeholder="Subject"
                            updateState={this.updateState}
                          />
                          <HelpBlock>{this.state.subjectError}</HelpBlock>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <div>
                          <ControlLabel>Body </ControlLabel>
                          <Row>
                            <div className="btn-toolbar" role="toolbar">
                              <div className="btn-group" role="group">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  title="Bold"
                                  onClick={this._onBoldClick}
                                >
                                  Bold
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  title="Italic"
                                  onClick={this._onItalicClick}
                                >
                                  Italic
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  title="Underline"
                                  onClick={this._onUnderlineClick}
                                >
                                  Underline
                                </button>
                              </div>
                            </div>
                          </Row>
                          <Editor
                            editorState={this.state.editorState}
                            handleKeyCommand={this.handleKeyCommand}
                            onChange={this.onChange}
                            handlePastedText={this.handlePastedText}
                            stripPastedStyles={false}
                            spellCheck={true}
                            ref={(ref) => {
                              if (ref != null) {
                                this.editorRef = ref;
                              }
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Well>
                </Grid>
              </Form>
            );
          })()}
        </EditDialog>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    owner: state.models.owner,
    currentUser: state.user,
    ui: state.ui.schoolBuses,
  };
}

export default connect(mapStateToProps)(SchoolBusesEmailDialog);
