import React, { Component } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import RegisterAddress from "./RegisterAddress";
import RegisterProposal from "./RegisterProposal";
import Vote from "./Vote";
import Result from "./Result";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';

import "./App.css";



const WorkflowStatus={//Etat d'avancement du vote
  RegisteringVoters : "RegisteringVoters",
  ProposalsRegistrationStarted: "ProposalsRegistrationStarted",
  ProposalsRegistrationEnded: "ProposalsRegistrationEnded",
  VotingSessionStarted: "VotingSessionStarted",
  VotingSessionEnded: "VotingSessionEnded",
  VotesTallied: "VotesTallied"
};

function Status_Sol2Web(Sol_Status){
  switch (Sol_Status){
    case "0":
      return WorkflowStatus.RegisteringVoters;
      break;
    case "1": 
      return WorkflowStatus.ProposalsRegistrationStarted;
      break;
    case "2": 
      return WorkflowStatus.ProposalsRegistrationEnded;
      break;
    case "3": 
      return WorkflowStatus.VotingSessionStarted;
      break;
    case "4": 
      return WorkflowStatus.VotingSessionEnded;
      break;
    case "5": 
      return WorkflowStatus.VotesTallied;
      break;
  }
}

class App extends Component {
  state = { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, HasVoted:false};

  initState = async () =>{
    return { Status: WorkflowStatus.RegisteringVoters, whitelist: null, Propositions: null, web3: null, accounts: null, contract: null, IsOwner:false, HasVoted:false};
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Voting.networks[networkId];
      const instance = new web3.eth.Contract(
        Voting.abi,
        deployedNetwork && deployedNetwork.address,
      );

      instance.events.VoterRegistered( this.HandleVoterRegistered);
      instance.events.ProposalsRegistrationStarted(this.HandleStartProposalRegistration);
      instance.events.ProposalRegistered(this.HandleProposalRegistered);
      instance.events.ProposalsRegistrationEnded(this.HandleProposalsRegistrationEnded);
      instance.events.VotingSessionStarted(this.HandleVotingSessionStarted);
      instance.events.Voted(this.HandleVote);
      instance.events.VotingSessionEnded(this.HandleVotingSessionEnded);
      instance.events.VotesTallied(this.HandleVotesTallied);
      //instance.events.Status((err,ev)=>{console.log("GetStatus:",ev.returnValues.status)});

      const owner_address = await instance.methods.owner().call();
      console.log("owner: ",owner_address);
      //console.log("instance: ",instance);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3: web3, accounts: accounts, contract: instance, IsOwner:(owner_address == accounts[0]) }, this.LoadState);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  LoadState = async () => {
    const { accounts, contract } = this.state;
    
    //var statu = await contract.methods.GetStatus().send({from:accounts[0]});
    var statu = await contract.methods.GetStatus().call();
    const Status = Status_Sol2Web(statu);

    //console.log("statu: ",statu,",  Status: ",Status);
    //const Status = await contract.methods.GetStatus().call();

    // récupérer la liste des comptes autorisés
    const whitelist = await contract.methods.GetWhiteList().call();
    let Propositions = await contract.methods.GetPropositions().call();

    if(Propositions)
      Propositions = Propositions.map(p=>{return({Description:p[0], Score:p[1]})});
   
    let HasVoted= false;

    if (whitelist && whitelist.includes(accounts[0])) {
      HasVoted = await contract.methods.HasVoted(accounts[0]).call();
    }
    

    console.log("LoadState: Status=",Status,", whitelist=",whitelist,", Propositions=",Propositions, "HasVoted=", HasVoted);

    // Mettre à jour le state 
    this.setState({Status:Status, whitelist: whitelist, Propositions:Propositions, HasVoted: HasVoted});
  
  };


/*Gére les événements reçus de la part du smart contract*/

  //S'acctive lorsqu'on reçoit un event "VoterRegistered"
  HandleVoterRegistered = async(err,ev) =>{
    let { whitelist, contract } = this.state;
    const voterAddress= ev.returnValues.voterAddress
    if(whitelist == null || !whitelist.includes(voterAddress)){
      whitelist = (whitelist != null) ? (whitelist.concat([voterAddress])): [voterAddress];
      this.setState({whitelist: whitelist});
    }

  };

  //S'acctive lorsqu'on reçoit un event "ProposalsRegistrationStarted"
  HandleStartProposalRegistration = async(err,event)=>{
    const statu = Status_Sol2Web("1");
    this.setState({Status: statu});
  }

  HandleProposalRegistered = async(err,event)=>{
    const { Propositions, contract } = this.state;
    const PropId = event.returnValues.proposalId;
    const Description = await contract.methods.ProposalDescriptionById(PropId).call();
    const Proposal = {Description: Description, Score:0};
    const NewProposition = (Propositions != null) ? (Propositions.concat([Proposal])): [Proposal];
    this.setState({Propositions: NewProposition});
  }

  HandleProposalsRegistrationEnded = async(err,event)=>{
    const statu = Status_Sol2Web("2");
    this.setState({Status: statu});
  }

  HandleVotingSessionStarted = async(err,event)=>{
    const statu = Status_Sol2Web("3");
    this.setState({Status: statu});
  }

  HandleVote = async(err,event)=>{
    const { Propositions, contract } = this.state
    const PropId = event.returnValues.proposalId;
    Propositions[PropId].Score++;
    this.setState({Propositions: Propositions});
  }

  HandleVotingSessionEnded = async(err,event)=>{
    const statu = Status_Sol2Web("4");
    this.setState({Status: statu});
  }

  HandleVotesTallied = async(err,event)=>{
    const { contract } = this.state;
    const statu = Status_Sol2Web("5");
    const Win = await contract.methods.winningProposalid().call();
    this.setState({Status:statu });
  }


      /*Permet d'effectuer des transactions vers le contract*/

  //Permet à l'Owner d'enregistrer l'addresse "address" dans la whitelist
  RegisterVoter=async (address) => {
    const { accounts, contract } = this.state;
    //const address = this.address.value;
    
    // Interaction avec le smart contract pour ajouter un compte 
    await contract.methods.RegisterVoter(address).send({from: accounts[0]});
    // Récupérer la liste des comptes autorisés
    //this.UpdateWhitelist();
  }

  //Permet à l'Owner de passer à l'étape de créations des propositions.
  BeginProposalsRegistration = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.BeginProposalStep().send({from:accounts[0]});
  }

  RegisterProposal = async(Proposal)=>{
    const {whitelist, accounts, contract } = this.state;
    if(whitelist.includes(accounts[0])){
      await contract.methods.RegisterProposal(Proposal).send({from: accounts[0]});
    }else{
      alert("Votre compte n'est pas inclut dans la Whitelist");
    }
  }

  EndProposalsRegistration = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.EndProposalStep().send({from:accounts[0]});
  }


  StartVoting = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.StartVoting().send({from:accounts[0]});
  }


  Vote = async(ProposalId)=>{
    const {whitelist, accounts, contract } = this.state;
    if(whitelist.includes(accounts[0])){
      await contract.methods.Vote(ProposalId).send({from: accounts[0]});
      this.setState({HasVoted:true});
    }else{
      alert("Votre compte n'est pas inclut dans la Whitelist");
    }
    
  }

  EndVoting = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.EndVoting().send({from:accounts[0]});
  }

  TaillingVotes = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.TaillingVotes().send({from:accounts[0]});

  }

  Reset = async ()=>{
    try{
      const { accounts, contract } = this.state;
      await contract.methods.Reset().send({from:accounts[0]});
      //this.setState(await this.initState());
      this.setState({Propositions:null, whitelist:null, Status: WorkflowStatus.RegisteringVoters, HasVoted:false});
      await this.LoadState();
    }catch(error){
       alert(
        `Failed reseting the contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  SelfDestruct = async()=>{
    const { accounts, contract } = this.state;
    await contract.methods.DestructContract().send({from:accounts[0]});
    this.setState(await this.initState());
    this.componentDidMount();
  }

  render(){
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    var show;
    console.log("State=",this.state);
    switch (this.state.Status){
      case WorkflowStatus.RegisteringVoters:
        show = <div className="App">
          <RegisterAddress 
             RegisterVoter={this.RegisterVoter}
             BeginProposalRegistering={this.BeginProposalsRegistration}
             whitelist={this.state.whitelist}
             IsOwner={this.state.IsOwner}
             Reset_Destruct={<Reset_Destruct HandleReset={this.Reset} HandleDestruct={this.SelfDestruct}/>}
          />
        </div>
        
        break;

      case WorkflowStatus.ProposalsRegistrationStarted: case WorkflowStatus.ProposalsRegistrationEnded:
        show= <div className="App">
          <RegisterProposal
            RegisterProposal={this.RegisterProposal}
            EndProposalsRegistration={this.EndProposalsRegistration}
            StartVoting={this.StartVoting}
            propositions={this.state.Propositions}
            IsOwner={this.state.IsOwner}
            EndProposal={(this.state.Status === WorkflowStatus.ProposalsRegistrationEnded)}
            Reset_Destruct={<Reset_Destruct HandleReset={this.Reset} HandleDestruct={this.SelfDestruct}/>}
          />
          </div>
        break;

      case (WorkflowStatus.VotingSessionStarted): case WorkflowStatus.VotingSessionEnded:
        show=<div className="App">
          <Vote
            Vote={this.Vote}
            EndVoting={this.EndVoting}
            TaillingVotes={this.TaillingVotes}
            propositions={this.state.Propositions}
            IsVoteEnded={(this.state.Status === WorkflowStatus.VotingSessionEnded)}
            IsOwner={this.state.IsOwner}
            HasVoted={this.state.HasVoted}
            Reset_Destruct={<Reset_Destruct HandleReset={this.Reset} HandleDestruct={this.SelfDestruct}/>}
          />
          </div>
        break;

        case WorkflowStatus.VotesTallied:{
          show=<div className="App">
            <Result
              propositions={this.state.Propositions}
              IsOwner={this.state.IsOwner}
              contract= {this.state.contract}
              NumVoter={this.state.whitelist.length}
              Reset_Destruct={<Reset_Destruct HandleReset={this.Reset} HandleDestruct={this.SelfDestruct}/>}
            />
            </div>
          break;
        }
    }
    
    return(show);
  }
}

function Reset_Destruct(props){
  /*return(
    <div className="row justify-content-center">
      <div className="col-3">
        <Button  onClick={ props.HandleReset } variant="danger" > Reset </Button>
      </div>
      <div className="col-3">
        <Button  onClick={ props.SelfDestruct } variant="danger" > SelfDestruct </Button>
      </div>
    </div>
    )*/
  return(
    <Button  onClick={ props.HandleReset } variant="danger" > Reset </Button>
    )
}


export default App;

