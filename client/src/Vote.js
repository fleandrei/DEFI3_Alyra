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


class Vote extends Component {
  //state = { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, VoteNumber:0 };

  constructor(props){
    super(props);
    this.state = {HasVoted:false};
    this.proposalId = React.createRef();
  }


  handleVote = async()=>{
    const proposalId= this.proposalId.current.value;
    console.log("Vote.js/handleVote: this.proposalId= ", this.proposalId.current.value);
    this.props.Vote(proposalId);
    this.setState({HasVoted:true});
  }

  handleFin = async()=>{
    this.props.EndVoting();
  }

  handleTailling = async()=>{
    if(this.props.IsVoteEnded){
      this.props.TaillingVotes();
    }else{
      alert("La session de vote n'est pas encore été terminée.")
    }
    
  }
  


  render() {
    const propositions  = this.props.propositions;
    var VoteSection;


    


    if(this.props.IsVoteEnded){ //Si la session de vote est terminée 
      VoteSection=<Container>
      <Jumbotron style={{background:"#ffcdd2"}}>
        <h2>La session de vote est terminée</h2>
        <p>
          Prochaine étape: Annoncement des résultats
        </p>
        
      </Jumbotron>
      </Container>;

    }else{ //Si on est encore en session de vote
      if(this.props.HasVoted){ //Si on a déjà voté
      
      VoteSection = <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card style={{ width:"500px" }}>
      <Card.Header> <strong style={{color:"green"}}> Vote prit en compte </strong></Card.Header>
      <Card.Body>
        <div class="row justify-content-around align-items-center">

        <div class="col-md-5"  style={{width:"500px"}}>
        <span>Proposition   &nbsp;

        <Form.Group style={{display: "inline-block"}} ref={vote=>{this.proposalId=vote}} >
          <Form.Control as="select" disabled>
            {propositions.map((prop,idx)=>{
              return <option>{idx}</option>
            })
          }
          </Form.Control>

        </Form.Group>
        </span>
        </div>
        <div class="col-md-3 offset-md-3">
        
        <Button onClick={this.handleVote} variant="primary" disabled> Voté </Button>
        </div>
        </div>
        
      </Card.Body>
      </Card>
      </div> 

      }else{ //Si on n'a pas encore voté

        VoteSection = <div style={{display: 'flex', justifyContent: 'center'}}>
        <Card style={{ width:"500px" }}>
        <Card.Header> <strong> Voter </strong></Card.Header>
        <Card.Body>
          <div class="row justify-content-around align-items-center">

        <div class="col-md-5 "  style={{width:"500px"}}>
        <span>Proposition   &nbsp;
        <Form >
        <Form.Group style={{display: "inline-block"}}  >
          <Form.Control as="select" ref={this.proposalId}>
            {propositions.map((prop,idx)=>{
              return <option value={idx.toString()}>{idx}</option>
            })
          }
          </Form.Control>
        
        </Form.Group>
        </Form>
        </span>
        </div>
        <div class="col-md-3 offset-md-3">
        
        <Button onClick={this.handleVote} variant="primary"  > Voter </Button>
        </div>
        </div>
        
        </Card.Body>
        </Card>
        </div> 
      }
    }



    return (
      <div className="App">
        <div>
        <h2 className="text-center">Dapp de Paiement</h2>
           <hr></hr>
           <br></br>
        <h3 className="text-center">Vote</h3>
        <br></br>
       </div>

      {VoteSection}


      <br/> 
      <hr width="70%"/>
      <br/>
      
      <div style={{display: 'flex', justifyContent: 'center'}}>

      <Card style={{ width: '50rem' }}>
      <Card.Header> <strong> Liste des Propositions </strong> </Card.Header>
      <Card.Body>
      {
        propositions.map((prop, idx)=>{
          return(
            <Accordion defaultActiveKey="0">
            <Card>
              <Accordion.Toggle as={Card.Header} eventKey={idx.toString()}>
                Proposition {idx}
              </Accordion.Toggle>
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
        
        {
          this.props.IsOwner &&   // Partie uniquement accessible à l'owner. Ce dernier a la possibilité de mettre fin à la phase d'enregistrement de propositions et de commencer la hase de vote 
              <div>
                <hr width="70%" style={{color:"green"}}></hr>
                <span style={{color:"green", font_size:"40px"}}><strong><font size="4">Administrateur</font></strong></span> <br/><br/>
               
                <div class="row justify-content-center">
                  <div class="col-3">
                    <Button onClick={ this.handleFin } variant="dark" > Fin de la session de vote </Button>
                  </div>  
                  <div class="col-3">
                    <Button onClick={ this.handleTailling } variant="primary" > Compter les voix </Button>
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


export default Vote;

