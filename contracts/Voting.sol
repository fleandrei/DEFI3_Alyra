/*
Voting system:
Address that are registered by the admin (the address who lauched the contract) are allowed to submit proposals (during the proposal session) and to vote for them (during the voting session). Proposal and voting sessions are scheduled by the admin. An address is allowed to vote for only one proposal. 
*/


pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Voting is Ownable{
    using SafeMath for uint;
    struct Voter {
    bool isRegistered;
    bool hasVoted;
    uint votedProposalId;
    }
    
    struct Proposal {
    string description;
    uint voteCount;
    }
    

    enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
    }
    
   
    
    /*Evénements*/
    event VoterRegistered(address voterAddress);
    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus
    newStatus);


    /*Variables d'état*/
    uint public winningProposalId;
    mapping(address=>Voter) Whitelist; //Les élécteurs enregistrés
    address [] ListAddress;
    Proposal[] Propositions; //Liste des propositions; numérotées à partir de 1.
    WorkflowStatus Etat = WorkflowStatus.RegisteringVoters; //Etats actuel du processus de vote



    /*Enregistre les addresses des élécteurs sur la Whitelist*/
    function RegisterVoter(address _address) public onlyOwner(){
        require(_address != address(0), "Addresse 0");
        require(Etat == WorkflowStatus.RegisteringVoters, "We are not at the Voter Registering stage");
        require(!Whitelist[_address].isRegistered, "Voter address is already registered");

        Whitelist[_address] = Voter(true, false, 0);
        ListAddress.push(_address);
        emit VoterRegistered(_address);
    }   

   
    /*Commence la session d'enregistrement de propositions*/
    function BeginProposalStep() public onlyOwner(){
        require(Etat == WorkflowStatus.RegisteringVoters, "Proposal stage must be launched from Voter registration stage");

        Etat = WorkflowStatus.ProposalsRegistrationStarted;
        emit ProposalsRegistrationStarted();
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /*Permet à l'utilisateur appelant de proposer une proposition*/
    function RegisterProposal(string memory _proposalDescription) public {
        require(Etat == WorkflowStatus.ProposalsRegistrationStarted, "We are not at the Proposals registration stage");
        require(Whitelist[msg.sender].isRegistered, "This acount address hasn't been registered");
        /*Vérifie que la proposition n'a pas déjà été proposée*/
        require(!ContainProposal(_proposalDescription), "This proposal has already been submited"); 

        Proposal memory Prop = Proposal(_proposalDescription, 0);
        Propositions.push(Prop);
        emit ProposalRegistered(Propositions.length-1);
    }

    

    /*Permet de mettre fin à la session d'enregistrement de proposition*/
    function EndProposalStep() public onlyOwner(){
        require(Etat == WorkflowStatus.ProposalsRegistrationStarted, "End Proposal registration stage but none has started ");
        Etat = WorkflowStatus.ProposalsRegistrationEnded;
        emit ProposalsRegistrationEnded();
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);

    }


    /*Permet de vérifier si une proposition a déjà été soumise.*/
    function ContainProposal(string memory _proposalDescription) private view returns(bool){
        uint len = Propositions.length;
        uint i;
        for(i = 0; i < len; i++){
            if(keccak256(bytes(Propositions[i].description)) == keccak256(bytes(_proposalDescription))){
                return true;
            }
        }
        return false;
    }

    
    function StartVoting() public onlyOwner(){
        require(Etat == WorkflowStatus.ProposalsRegistrationEnded, "The voting stage can begin only after the proposal registration one has ended");

        Etat = WorkflowStatus.VotingSessionStarted;
        emit VotingSessionStarted();
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    function Vote(uint proposalId) public{
        require(Etat == WorkflowStatus.VotingSessionStarted, "We are not at the Voting stage");
        require(Whitelist[msg.sender].isRegistered, "This acount address hasn't been registered");
        require(!Whitelist[msg.sender].hasVoted, "This account has already voted");
        require((Propositions.length > proposalId) , "This proposal doesn't exist");
        

        Whitelist[msg.sender].votedProposalId = proposalId;
        Whitelist[msg.sender].hasVoted = true;
        Propositions[proposalId].voteCount = Propositions[proposalId].voteCount.add(1);
        emit Voted (msg.sender,  proposalId);
        
    } 

    function EndVoting() public onlyOwner(){
        require(Etat == WorkflowStatus.VotingSessionStarted, "End the Voting session stage but none has started");

        Etat = WorkflowStatus.VotingSessionEnded;
        emit VotingSessionEnded();
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }
    
    function TaillingVotes() public onlyOwner() {
        require(Etat == WorkflowStatus.VotingSessionEnded, "The vote counting stage can begin only after the voting one has ended");
        
        uint Win; //L'identifiant de la proposition gagnante
        uint bestScore = 0; // Meilleur score électoral obtenu
        uint i;
        uint len = Propositions.length;
        for(i = 0; i<len; i++){
            if(Propositions[i].voteCount > bestScore){
                bestScore = Propositions[i].voteCount;
                Win = i;
            }
        }
        
        winningProposalId = Win;
        
        Etat = WorkflowStatus.VotesTallied;
        emit VotesTallied();
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    } 



    //L'Owner peut supprimer le contract lorsque le vote est terminé 
    function DestructContract() public onlyOwner(){
        selfdestruct(msg.sender);
    }
    
    //L'Owner peut réinitialiser le contract
    function Reset() public onlyOwner(){
        delete winningProposalId;
        delete Propositions;
        Etat = WorkflowStatus.RegisteringVoters;
        uint i;
        uint len= ListAddress.length;
        for(i=0; i<len; i++){
            delete Whitelist[ListAddress[i]];
        }
        delete ListAddress;
    }
   


        /*Fonctions de type VIEW*/

        //Récupère la whitelist
    function GetWhiteList() public view returns(address[] memory){
        return ListAddress;
    }

        //Récupère la liste des propositions
    function GetPropositions() public view returns(Proposal[] memory){
        return Propositions;
    }

    //event Status(WorkflowStatus status);

    function GetStatus() public view returns(WorkflowStatus){
        //emit Status(Etat); 
        return Etat;
    }  
    
    function HasVoted(address voter) public view returns(bool){
        require(Whitelist[voter].isRegistered, "This acount address hasn't been registered");
        return Whitelist[voter].hasVoted;
    }

    function GetVoteNumber() public view returns(uint){
        uint voteCount = 0;
        uint len = ListAddress.length;
        uint i;
        for(i=0; i<len; i++){
            if(Whitelist[ListAddress[i]].hasVoted){
                voteCount= voteCount.add(1);
            }
        }
        return voteCount;      
    }


    function WinningProposalDescription() public view returns(string memory){
        require(Etat== WorkflowStatus.VotesTallied, "Vote counting isn't done");
        return Propositions[winningProposalId].description;
    }
        
    
    function WinningProposalScore() public view returns(uint){
        require(Etat== WorkflowStatus.VotesTallied, "Vote counting isn't done");
        return Propositions[winningProposalId].voteCount;
    }

    function winningProposalid() public view returns(uint){
        require(Etat== WorkflowStatus.VotesTallied, "Vote counting isn't done");
        return winningProposalId;
    }
    
    function ProposalNumber() public view returns(uint){
        return Propositions.length;
    }
    
    function ProposalDescriptionById(uint Id) public view returns(string memory){
        require(Id < Propositions.length, "This proposal doesn't exist");
        return Propositions[Id].description;
    }
    
    function ProposalSocreById(uint Id) public view returns(uint){
         require(Id < Propositions.length, "This proposal doesn't exist");
        return Propositions[Id].voteCount;
    }
    
    fallback() external{
        require(msg.data.length == 0, "FallBack called"); //On prévient l'utilisateur qu'il appelle la fonction fallback, au cas où il a appellé une fonction qui n'existe pas dans le contract
    }
    
}