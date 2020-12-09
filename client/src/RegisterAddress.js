import React, { Component } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';

import "./App.css";


class RegisterAddress extends Component {
  //state = { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, VoteNumber:0 };

  constructor(props){
    super(props);
  }

  handleAutoriser = async()=>{
    const address= this.address.value;
    this.address.value="";
    this.props.RegisterVoter(address);
  }


  handleProposition = async()=>{
    this.props.BeginProposalRegistering();
  }


  render() {
    const whitelist  = this.props.whitelist;
    //console.log("whitelist: ",whitelist);
    
    return (
      <div className="App">
        <div>
        <h2 className="text-center">Dapp de Paiement</h2>
           <hr></hr>
           <br></br>
        <h3 className="text-center">Enregistrement des élécteurs</h3>
        <br></br>
       </div>
       <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Liste des comptes autorisés</strong></Card.Header>
            <Card.Body>
            <div   >
              <ListGroup variant="flush"   >
                <ListGroup.Item>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>@</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whitelist !== null &&
                        whitelist.map((a) => <tr><td>{a}</td></tr>)
                      }
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </div>
        <br/>

        {
          this.props.IsOwner &&   //Seul l'owner a le droit de rajouter des électeurs à la whiteliste
          <div>
          <br></br>
            <hr width="70%" style={{color:"green"}}></hr>
            <span style={{color:"green", font_size:"40px"}}><strong><font size="4">Administrateur</font></strong></span> <br/><br/>
            <div style={{display: 'flex', justifyContent: 'center'}}>              
              <Card style={{ width: '50rem' }}>
                <Card.Header><strong> Autoriser un nouveau compte</strong></Card.Header>
                <Card.Body>
                  <Form.Group controlId="formAddress">
                    <Form.Control type="text"  id="address" placeholder="Enter address"
                    ref={(input) => { this.address = input }}
                    //ref={(input) => { this.handleAutoriser(input)}}
                    />
                  </Form.Group>
                  
                  
                  <Button onClick={ this.handleAutoriser } variant="primary" > Autoriser </Button>
                </Card.Body>
              </Card>
            </div>
              <br/>
              <div>
                <Button onClick={ this.handleProposition } variant="dark" > Démarer la soumission de propositions </Button>
              </div>  
                <br/>
                <br/>
              <div  style={{ justifyContent: 'center'}}>
                {this.props.Reset_Destruct}
              </div>

          </div>
        }
        <br></br>
      
      </div>
    );
 }

}


export default RegisterAddress;

