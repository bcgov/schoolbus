import React from 'react';

import { connect } from 'react-redux';

import { Grid, Row, Col, Well} from 'react-bootstrap';
import { Form, FormGroup, ControlLabel, HelpBlock } from 'react-bootstrap';
import * as Constant from '../../constants';

import DropdownControl from '../../components/DropdownControl.jsx';
import EditDialog from '../../components/EditDialog.jsx';
import FormInputControl from '../../components/FormInputControl.jsx';
import Spinner from '../../components/Spinner.jsx';
import CheckboxControl from '../../components/CheckboxControl.jsx';

import { isBlank } from '../../utils/string';

var ContactEditDialog = React.createClass({
  propTypes: {
    owner: React.PropTypes.object.isRequired,
    contact: React.PropTypes.object.isRequired,
    onSave: React.PropTypes.func.isRequired,
    onClose: React.PropTypes.func.isRequired,
    show: React.PropTypes.bool,
  },

  getInitialState() {

    return {
      loading:false,

      isPrimary: (this.props.owner.primaryContact && this.props.contact.id === this.props.owner.primaryContact.id ) ? true : false,

      currentContact: {
        id: this.props.contact.id ? this.props.contact.id : 0,
        address1: this.props.contact.address1 ? this.props.contact.address1 : '',
        address2: this.props.contact.address2 ? this.props.contact.address2 : '',
        city: this.props.contact.city ? this.props.contact.city : '',
        emailAddress: this.props.contact.emailAddress ? this.props.contact.emailAddress : '',
        faxPhoneNumber: this.props.contact.faxPhoneNumber ? this.props.contact.faxPhoneNumber : '',
        givenName: this.props.contact.givenName ? this.props.contact.givenName : '',
        mobilePhoneNumber: this.props.contact.mobilePhoneNumber ? this.props.contact.mobilePhoneNumber : '',
        notes: this.props.contact.notes ? this.props.contact.notes : '',
        organizationName: this.props.contact.organizationName ? this.props.contact.organizationName : '',
        postalCode: this.props.contact.postalCode ? this.props.contact.postalCode : '',
        province: this.props.contact.province ? this.props.contact.province : '',
        role: this.props.contact.role ? this.props.contact.role : '',
        surname: this.props.contact.surname ? this.props.contact.surname : '',
        workPhoneNumber: this.props.contact.workPhoneNumber ? this.props.contact.workPhoneNumber : '',
      },
      
      primaryContact: this.props.owner.primaryContact ? this.props.owner.primaryContact : null,

      surnameError: false,
      emailError:false,
      workPhoneError:false,
      address1Error: false,
      cityError: false,
      provinceError: false,
      postalCodeError: false,
    };
  },

  componentDidMount(){
    this.setState({ loading: true });

    if(this.props.contact !== null){
      this.setState({ loading: false });
    }
  },

  updateState(state, callback){
    this.setState({ currentContact: { ...this.state.currentContact, ...state } }, () => {
      if(callback) { callback(); }
    });
  },

  updatePrimaryContact(){
    var primaryContact = this.state.primaryContact;

    if(primaryContact === null || this.state.isPrimary === false){
      this.setState({ 
        primaryContact: this.state.currentContact,
        isPrimary: true,
      });
    } else {
      this.setState({
        primaryContact: null,
        isPrimary: false,
      });
    }
  },

  isValid(){
    this.setState({
      surnameError: false,
      emailError:false,
      workPhoneError:false,
      address1Error: false,
      cityError: false,
      provinceError: false,
      postalCodeError: false,
    });

    var valid = true;

    if(isBlank(this.state.currentContact.surname)){
      this.setState({ surnameError: 'Last name is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.emailAddress)){
      this.setState({ emailError: 'E-mail is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.workPhoneNumber)){
      this.setState({ workPhoneError: 'Work phone number is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.address1)){
      this.setState({ address1Error: 'Address is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.city)){
      this.setState({ cityError: 'City is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.province)){
      this.setState({ provinceError: 'Province is required' });
      valid = false;
    }

    if(isBlank(this.state.currentContact.postalCode)){
      this.setState({ postalCodeError: 'Postal code is required' });
      valid = false;
    }

    return valid;
  },

  onSave() {
    this.props.onSave(
      { ...this.props.contact, ...this.state.currentContact },
      { ...this.props.owner, ...{ primaryContact: this.state.primaryContact }}
    );
  },

  didChange(){
    if(this.state.currentContact.id !== this.props.contact.id) { return true; }
    if(this.state.currentContact.givenName !== this.props.contact.givenName) { return true; }
    if(this.state.currentContact.surname !== this.props.contact.surname) { return true; }
    if(this.state.currentContact.organizationName !== this.props.contact.organizationName) { return true; }
    if(this.state.currentContact.emailAddress !== this.props.contact.emailAddress) { return true; }
    if(this.state.currentContact.workPhoneNumber !== this.props.contact.workPhoneNumber) { return true; }
    if(this.state.currentContact.mobilePhoneNumber !== this.props.contact.mobilePhoneNumber) { return true; }
    if(this.state.currentContact.faxPhoneNumber !== this.props.contact.faxPhoneNumber) { return true; }
    if(this.state.currentContact.address1 !== this.props.contact.address1) { return true; }
    if(this.state.currentContact.address2 !== this.props.contact.address2) { return true; }
    if(this.state.currentContact.city !== this.props.contact.city) { return true; }
    if(this.state.currentContact.province !== this.props.contact.province) { return true; }
    if(this.state.currentContact.postalCode !== this.props.contact.postalCode) { return true; }
    if(this.state.currentContact.notes !== this.props.contact.notes) { return true; }
    if(this.state.currentContact.role !== this.props.contact.role) { return true; }
    if(this.props.owner.primaryContact === null) {
      if(this.state.primaryContact !== this.props.owner.primaryContact) { return true; }
    } else {
      if (this.state.primaryContact == null) { 
        return true; 
      } else if (this.state.primaryContact.id !== this.props.owner.primaryContact.id){
        return true;
      }
    } 

    return false;
  },

  render() {
    var provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

    return <EditDialog id="contact-edit" show={ this.props.show } onClose={ this.props.onClose } onSave={ this.onSave } 
    didChange={ this.didChange } isValid={ this.isValid } title={ <strong>Contact</strong> }>

    {(() => {
      if(this.state.loading) { return <div style={ {textAlign: 'center'} }><Spinner/></div>; }

      return <Form>
        <Grid fluid>
          <Well>
            <Row>
              <Col md={4}>
                <FormGroup controlId="givenName">
                  <ControlLabel>First name</ControlLabel>
                  <FormInputControl id="givenName" type="text" defaultValue={ this.state.currentContact.givenName } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="surname" validationState={ this.state.surnameError ? 'error' : null }>
                  <ControlLabel>Last name <sup>*</sup></ControlLabel>
                  <FormInputControl id="surname" type="text" defaultValue={ this.state.currentContact.surname } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.surnameError }</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="role">
                  <ControlLabel>Role</ControlLabel>
                  <DropdownControl id="role" title={ this.state.currentContact.role } items={[Constant.CONTACT_ROLE_DRIVER, Constant.CONTACT_ROLE_ASSISTANT, Constant.CONTACT_ROLE_MECHANIC, Constant.CONTACT_ROLE_OWNER, Constant.CONTACT_ROLE_SUPERVISOR]} updateState={ this.updateState } 
                    placeholder="None" blankLine />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <ControlLabel controlId="organizationName">Organization name</ControlLabel>
                  <FormInputControl id="organizationName" type="text" defaultValue={ this.state.currentContact.organizationName } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="emailAddress" validationState={ this.state.emailError ? 'error' : null }>
                  <ControlLabel>Email <sup>*</sup></ControlLabel>
                  <FormInputControl id="emailAddress" type="text" defaultValue={ this.state.currentContact.emailAddress } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.emailError }</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="workPhoneNumber" validationState={ this.state.workPhoneError ? 'error' : null }>
                  <ControlLabel>Work phone <sup>*</sup></ControlLabel>
                  <FormInputControl id="workPhoneNumber" type="text" defaultValue={ this.state.currentContact.workPhoneNumber } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.workPhoneError }</HelpBlock>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup controlId="mobilePhoneNumber">
                  <ControlLabel>Mobile phone</ControlLabel>
                  <FormInputControl id="mobilePhoneNumber" type="text" defaultValue={ this.state.currentContact.mobilePhoneNumber } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="faxPhoneNumber">
                  <ControlLabel>Fax phone</ControlLabel>
                  <FormInputControl id="faxPhoneNumber" type="text" defaultValue={ this.state.currentContact.faxPhoneNumber } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
            </Row>
          </Well>
          <Well>
            <Row>
              <Col md={4}>
                <FormGroup controlId="address1" validationState={ this.state.address1Error ? 'error' : null }>
                  <ControlLabel>Address 1 <sup>*</sup></ControlLabel>
                  <FormInputControl id="address1" type="text" defaultValue={ this.state.currentContact.address1 } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.address1Error }</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="address2">
                  <ControlLabel>Address 2</ControlLabel>
                  <FormInputControl id="address2" type="text" defaultValue={ this.state.currentContact.address2 } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="city" validationState={ this.state.cityError ? 'error' : null }>
                  <ControlLabel>City <sup>*</sup></ControlLabel>
                  <FormInputControl id="city" type="text" defaultValue={ this.state.currentContact.city } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.cityError }</HelpBlock>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup controlId="province" validationState={ this.state.provinceError ? 'error' : null }>
                  <ControlLabel>Province <sup>*</sup></ControlLabel>
                  <DropdownControl id="province" title={ this.state.currentContact.province } items={ provinces } updateState={ this.updateState } 
                    placeholder="None" blankLine />
                  <HelpBlock>{ this.state.provinceError }</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="postalCode" validationState={ this.state.postalCodeError ? 'error' : null }>
                  <ControlLabel>Postal code <sup>*</sup></ControlLabel>
                  <FormInputControl id="postalCode" type="text" defaultValue={ this.state.currentContact.postalCode } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.postalCodeError }</HelpBlock>
                </FormGroup>
              </Col>
            </Row>
          </Well>
          <Well>
            <Row>
              <Col md={8}>
                <FormGroup controlId="notes">
                  <ControlLabel>Note</ControlLabel>
                  <FormInputControl id="notes" componentClass="textarea" value={ this.state.currentContact.notes } updateState={ this.updateState }/>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup controlId="primaryContact">
                  <CheckboxControl inline id="primaryContact" checked={ this.state.isPrimary } onChange = { this.updatePrimaryContact }>Make primary</CheckboxControl> 
                </FormGroup>
              </Col>
            </Row>
          </Well>
        </Grid>
      </Form>;
    })()}

    </EditDialog>;
  },
});

function mapStateToProps(state){
  return {
    owner: state.models.owner,
  };
}

export default connect(mapStateToProps)(ContactEditDialog);