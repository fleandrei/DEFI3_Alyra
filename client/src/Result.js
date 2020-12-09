import React, { Component } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Accordion from 'react-bootstrap/Accordion'


import "./App.css";

function Proposition(props){
  if(props.idx == props.WinPropId){
    return  <Card.Header style={{backgroundColor:"#c8e6c9"}} >  
              <Accordion.Toggle as={Card.Header} eventKey={props.idx.toString()}>
                Proposition {props.idx} : <em>{props.prop.Score} voix</em>
              </Accordion.Toggle>
            </Card.Header>
  }else{
    return <Card.Header >
      <Accordion.Toggle as={Card.Header} eventKey={props.idx.toString()}>
        Proposition {props.idx} : <em>{props.prop.Score} voix</em>
      </Accordion.Toggle>
    </Card.Header>
  }
}

class Result extends Component {
  //state = { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, VoteNumber:0 };
  state= {WinPropId:null};
  constructor(props){
    super(props);
    const contract = this.props.contract;
    
    contract.methods.winningProposalid().call().then(res=>{ this.setState({WinPropId: res});});
   
  }



  render() {
    if (!this.state.WinPropId) {
      return <div>Tailling result...</div>;
    }
    const propositions  = this.props.propositions;
    const WinPropId = this.state.WinPropId; 
    const NumVoter= this.props.NumVoter;
    

    return (
      <div className="App">
        <div>
        <h2 className="text-center">Dapp de Paiement</h2>
           <hr></hr>
           <br></br>
        <h3 className="text-center">Résultats</h3>
        <br></br>
       </div>

      <Container>
      <Jumbotron style={{background:"#2BBBAD"}}>
        <h2 style={{color:"white"}}>La <strong><em>Proposition {WinPropId}</em></strong> a gagné <br/> avec {(100*propositions[WinPropId].Score/NumVoter).toFixed(2)}% du corps éléctoral</h2>
        
      </Jumbotron>
      </Container>

      <hr width="70%"/> 

      <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card style={{ width: '50rem' }}>
      <Card.Header> <strong> Liste des Propositions </strong> </Card.Header>
      <Card.Body>
      {
        propositions.map((prop, idx)=>{
          return(
            <Accordion defaultActiveKey={WinPropId.toString()}>
            <Card>

              <Proposition prop={prop} idx={idx} WinPropId={WinPropId} />


              <Accordion.Collapse eventKey={idx.toString()}>
                <Card.Body>
                {prop.Description}
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            </Accordion>
          )
        })
      }
      </Card.Body>
      </Card>
      </div>

      <br/> 
      <hr width="70%"/>      
        {
          this.props.IsOwner &&  <div style={{ justifyContent: 'center'}}> 
            <span style={{color:"green", font_size:"40px"}}><strong><font size="4">Administrateur</font></strong></span> <br/><br/>
            {this.props.Reset_Destruct}
            </div>
              

          
        }
        <br></br>
      
      </div>
    );
 }

}


export default Result;

