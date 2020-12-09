import React, { Component } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import ReactDOM from 'react-dom';
import "./App.css";


class RegisterProposal extends Component {
  //state = { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, VoteNumber:0 };

  constructor(props){
    super(props);
    //this.state = {EndProposal:false};
    this.proposal = "";

    this.Param = {sectionMaxHeight:"300px", heightProposalHeader:"3rem",heightProposalBody:"50px", PaddingProposalBody:"1%", ProposalMaxHeight:"40px"}
  }


  handleProposal = async()=>{
    const proposal= this.proposal.value;
    this.proposal.value= "";
    this.props.RegisterProposal(proposal);

  }

  handleFin = async()=>{
    this.props.EndProposalsRegistration();
  }


  handleVote = async()=>{
    if (this.props.EndProposal) {
      this.props.StartVoting();
    }else{
      alert("La session d'enregistrement des propositions n'a pas encore été terminé.");
    }
  }


  render() {
    const propositions  = this.props.propositions;
    console.log("RegisterProposal:render  propositions=",propositions[0]);
    var ProposRegisterSection;
    if (this.props.EndProposal) {
      ProposRegisterSection=<Container>
      <Jumbotron style={{background:"#ffcdd2"}}>
        <h2>La session d'enregistrement des propositions est terminée</h2>
        <p>
          Prochaine étape: voter pour les propositions
        </p>
        
      </Jumbotron>
      </Container>
    }else{
      ProposRegisterSection=<div>
          <br></br>
            <div style={{display: 'flex', justifyContent: 'center'}}>              
              <Card style={{ width: '50rem' }}>
                <Card.Header><strong> Ajouter une proposition</strong></Card.Header>
                <Card.Body>
                  <Form.Group controlId="formAddress">
                    <Form.Control as="textarea" id="proposal" placeholder="Entrer une proposition"
                    ref={(input) => { this.proposal = input }}
                    />                  
                    </Form.Group>
                  
                  
                  <Button onClick={ this.handleProposal } variant="primary" > Proposer </Button>
                </Card.Body>
              </Card>
            </div>
        </div>
    }


    return (
      <div className="App">
        <div>
        <h2 className="text-center">Dapp de Paiement</h2>
           <hr></hr>
           <br></br>
        <h3 className="text-center">Soumission des Propositions</h3>
        <br></br>
       </div>
       
       {ProposRegisterSection}

        <br/>
       <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>

            <Card.Header><strong>Liste des Propositions</strong></Card.Header>
            <Card.Body>
            <div style={{overflowY: 'scroll', maxHeight:this.Param.sectionMaxHeight}}>
            
              <ListGroup variant="flush" class="overflow-auto">
              {propositions !== null &&
                        propositions.map( (a , idx) => { return(<ListGroup.Item><Card > <Card.Header style={{height:this.Param.heightProposalHeader}}>Proposition {idx} </Card.Header ><Card.Body style={{height:this.Param.heightProposalBody, padding:this.Param.PaddingProposalBody }}><div style={{ overflowY: 'scroll', maxHeight:this.Param.ProposalMaxHeight}}>{a.Description}</div></Card.Body></Card></ListGroup.Item>)})
              }
              </ListGroup>
            </div>
               
            </Card.Body>
          </Card>
        </div>
        <br/>
        

        {
          this.props.IsOwner &&   // Partie uniquement accessible à l'owner. Ce dernier a la possibilité de mettre fin à la phase d'enregistrement de propositions et de commencer la hase de vote 
              <div>
                <hr width="70%" style={{color:"green"}}></hr>
                <span style={{color:"green", font_size:"40px"}}><strong><font size="4">Administrateur</font></strong></span> <br/><br/>
               
                <div class="row justify-content-center">
                  <div class="col-3">
                    <Button onClick={ this.handleFin } variant="dark" > Fin de la soumission de propositions </Button>
                  </div>  
                  <div class="col-3">
                    <Button onClick={ this.handleVote } variant="primary" > Démarrer le vote </Button>
                  </div>  
                </div>

                <br/>
                <br/>
                <div style={{ justifyContent: 'center'}}> 
                  {this.props.Reset_Destruct}
                </div>
              </div>

          
        }
        <br></br>
      
      </div>
    );
 }

}


export default RegisterProposal;

