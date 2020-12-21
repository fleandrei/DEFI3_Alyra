// erc20.test.js
const { BN, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const Voting = artifacts.require('Voting');
const chance = require("chance").Chance();

function Winner(liste, nbrProp){
	L= new Array(nbrProp).fill(0);
	liste.forEach(choix =>{
		L[choix] +=1;
	});
	
	return L.indexOf(Math.max.apply(Math, L));
}



contract('Systeme Payement', function(accounts){
	const owner = accounts[0];
	const Voter1 = accounts[1];
	const Voter2 = accounts[2];
	const Voter3 = accounts[3];

	var Prop1;
	var Prop2;

	var Choix1;
	var Choix2;
	var Choix3;

	var VoteInstance;

		
	/* Enregistrement des comptes dans la whitelist*/
	describe("Register accounts in Whitelist", ()=>{
		beforeEach(async function () {
		this.VoteInstance = await Voting.new({from: owner});
		});
		
		it("Ajout de compte par le propriétaire ", async function(){
			let res = await this.VoteInstance.RegisterVoter(Voter1);
			let list = await this.VoteInstance.GetWhiteList();

			expect(list[0]).to.equal(Voter1);
			await expectEvent(res, "VoterRegistered", {voterAddress: Voter1}, "VoterRegistered event incorrect");
		});

		it("Tentative d'ajout d'un compte par un membre non propriétaire ", async function(){
			//let res = await this.VoteInstance.RegisterVoter(Voter2, {from: Voter1});
			await expectRevert.unspecified( this.VoteInstance.RegisterVoter(Voter2, {from: Voter1}));
		});

		it("Passage à l'étape d'enregistrement des Propositions ", async function(){
			let res = await this.VoteInstance.BeginProposalStep();
			let status = await this.VoteInstance.GetStatus();

			expect(status.words[0]).to.equal(1);//Vérification du status

			/*Vérification des event*/
			await expectEvent(res, "ProposalsRegistrationStarted");
			await expectEvent(res, "WorkflowStatusChange", {previousStatus:"0" , newStatus:"1"}, "VoterRegistered event incorrect");
		});

		it("Tentative de Passage à l'étape d'enregistrement des Propositions par un compte non administrateur ", async function(){
			await expectRevert.unspecified( this.VoteInstance.BeginProposalStep( {from: Voter1}));
		});
	});


	/* Enregistrement des propositions*/
	describe("Register Propositions", ()=>{

		beforeEach(async function () {
			this.VoteInstance = await Voting.new({from: owner});
			await this.VoteInstance.RegisterVoter(owner);
			await this.VoteInstance.RegisterVoter(Voter1);
			await this.VoteInstance.RegisterVoter(Voter2);
			prop1 = chance.sentence({words: chance.natural({min:1, max:30})});
		});

		it("Tentative d'ajout de proposition alors que l'on n'est pas à l'étape d'enregistrement des propositions", async function(){
			await expectRevert.unspecified(this.VoteInstance.RegisterProposal(prop1));
		});


		it("Tentative d'ajout de proposition par un compte qui n'est pas dans la whitelist", async function(){
			await this.VoteInstance.BeginProposalStep();
			await expectRevert.unspecified(this.VoteInstance.RegisterProposal(prop1, {from: Voter3}));
		});

		it("Ajout d'une proposition par un compte autorisé; puis ajout de la même proposition par un autre agent autorisé", async function(){
			await this.VoteInstance.BeginProposalStep();
			res = await this.VoteInstance.RegisterProposal(prop1, {from: Voter1});	
			var listProp= await this.VoteInstance.GetPropositions();

			expect(listProp[0][0]).to.equal(prop1);
			await expectEvent(res, "ProposalRegistered", {proposalId: "0"}, "ProposalRegistered event incorrect");
			await expectRevert.unspecified(this.VoteInstance.RegisterProposal(prop1, {from: Voter2})); //On soumet la même proposition une seconde fois.

		});

		it("Fin de la phase d'enregistrement des propositions", async function(){
			await this.VoteInstance.BeginProposalStep();
			var res = await this.VoteInstance.EndProposalStep();
			let status = await this.VoteInstance.GetStatus();


			expect(status.words[0], "Status should be ProposalsRegistrationEnded").to.equal(2);// Vérification que le statu est bien ProposalsRegistrationEnded

			await expectEvent(res, "ProposalsRegistrationEnded", {}, "ProposalsRegistrationEnded event incorrect");
			await expectEvent(res, "WorkflowStatusChange", {previousStatus:"1" , newStatus:"2"}, "WorkflowStatusChange event incorrect");
			
			await expectRevert.unspecified(this.VoteInstance.RegisterProposal(prop1)); // Tentative d'ajouter une proposition alors que la phase de proposition est terminée
		});


	});


	/* Phase de vote*/
	describe("Voting Step", ()=>{

		beforeEach(async function () {
			this.VoteInstance = await Voting.new({from: owner});
			await this.VoteInstance.RegisterVoter(owner);
			await this.VoteInstance.RegisterVoter(Voter1);
			await this.VoteInstance.RegisterVoter(Voter2);

			await this.VoteInstance.BeginProposalStep();

			prop1 = chance.sentence({words: chance.natural({min:1, max:30})});
			prop2 = chance.sentence({words: chance.natural({min:1, max:30})});
			/*Les deux propositions sont entrée par des agents pris au hasard*/
			await this.VoteInstance.RegisterProposal(prop1, {from: accounts[chance.natural({max:2})]});
			await this.VoteInstance.RegisterProposal(prop2, {from: accounts[chance.natural({max:2})]});

			await this.VoteInstance.EndProposalStep();

			Choix1 = chance.natural({max:1});

		});

		it("Tentative de vote, alors que l'on n'est pas à la phase de vote", async function(){
			await expectRevert.unspecified(this.VoteInstance.Vote(Choix1));
		});

		it("Passage à l'étape d'enregistrement des Votes ", async function(){
			let res = await this.VoteInstance.StartVoting();
			let status = await this.VoteInstance.GetStatus();

			expect(status.words[0]).to.equal(3);//Vérification que le status est VotingSessionStarted

			/*Vérification des event*/
			await expectEvent(res, "VotingSessionStarted");
			await expectEvent(res, "WorkflowStatusChange", {previousStatus:"2" , newStatus:"3"}, "WorkflowStatusChange event incorrect");
		});

		it("Tentative de vote par un compte qui n'est pas dans la whitelist", async function(){
			await this.VoteInstance.StartVoting();
			await expectRevert.unspecified(this.VoteInstance.Vote(Choix1, {from: Voter3}));
		});

		it("Deux comptes autorisés votent une fois", async function(){
			await this.VoteInstance.StartVoting();
			Choix2 = chance.natural({max:1});


			/*Le premier compte vote*/
			var res1 = await this.VoteInstance.Vote(Choix1, {from: Voter1});
			var score1 = await this.VoteInstance.ProposalSocreById(Choix1);
			var hasvoted1 = await this.VoteInstance.HasVoted(Voter1);

			/*Le deuxième compte vote*/
			var score2Ini = await this.VoteInstance.ProposalSocreById(Choix2);
			var res2 = await this.VoteInstance.Vote(Choix2, {from: Voter2});
			var score2Fin = await this.VoteInstance.ProposalSocreById(Choix2);
			var hasvoted2 = await this.VoteInstance.HasVoted(Voter2);

			
			/*Vérification des score après vote*/
			const un = new BN(1);
			expect(score1).to.be.bignumber.equal(un);
			expect(score2Fin - score2Ini).to.equal(1);

			/*Vérifie que les comptes sont conssidérés comme ayant voté*/
			expect(hasvoted1);
			expect(hasvoted2);

			/*Vérification des events*/
			await expectEvent(res1, "Voted", {voter: Voter1, proposalId: Choix1.toString()}, "Voted event incorrect");
			await expectEvent(res2, "Voted", {voter: Voter2, proposalId: Choix2.toString()}, "Voted event incorrect");
		
		});

		it("Un compte tente de voter deux fois", async function(){
			await this.VoteInstance.StartVoting();
			await this.VoteInstance.Vote(chance.natural({max:1}), {from: Voter1});//Premier vote
			await expectRevert.unspecified(this.VoteInstance.Vote(chance.natural({max:1}), {from: Voter1})); //Deuxième vote
		});

		it("Fin de la phase de vote", async function(){
			await this.VoteInstance.StartVoting();
			var res = await this.VoteInstance.EndVoting();
			let status = await this.VoteInstance.GetStatus();


			expect(status.words[0], "Status should be ProposalsRegistrationEnded").to.equal(4);// Vérification que le statu est bien VotingSessionEnded

			await expectEvent(res, "VotingSessionEnded", {}, "VotingSessionEnded event incorrect");
			await expectEvent(res, "WorkflowStatusChange", {previousStatus:"3" , newStatus:"4"}, "WorkflowStatusChange event incorrect");
			
			await expectRevert.unspecified(this.VoteInstance.Vote(chance.natural({max:1}))); // Tentative d'un compte de voter alors que la phase de vote est terminée
		});

	});

	describe("Tailling Votes", () =>{

		beforeEach(async function () {
			this.VoteInstance = await Voting.new({from: owner});
			await this.VoteInstance.RegisterVoter(owner);
			await this.VoteInstance.RegisterVoter(Voter1);
			await this.VoteInstance.RegisterVoter(Voter2);

			await this.VoteInstance.BeginProposalStep();

			prop1 = chance.sentence({words: chance.natural({min:1, max:30})});
			prop2 = chance.sentence({words: chance.natural({min:1, max:30})});
			/*Les deux propositions sont entrée par des agents pris au hasard*/
			await this.VoteInstance.RegisterProposal(prop1, {from: accounts[chance.natural({max:2})]});
			await this.VoteInstance.RegisterProposal(prop2, {from: accounts[chance.natural({max:2})]});

			await this.VoteInstance.EndProposalStep();

			await this.VoteInstance.StartVoting();

			Choix1 = chance.natural({max:1});
			Choix2 = chance.natural({max:1});
			Choix3 = chance.natural({max:1});

			await this.VoteInstance.Vote(Choix1, {from: owner});
			await this.VoteInstance.Vote(Choix2, {from: Voter1});
			await this.VoteInstance.Vote(Choix3, {from: Voter2});

		});

		it("Tentative de compter les voix, alors que l'on n'est pas à la phase de comptage des votes", async function(){
			await expectRevert.unspecified(this.VoteInstance.TaillingVotes());
		});

		it("Tentative de compter les voix par un compte qui n'est l'owner", async function(){
			await this.VoteInstance.EndVoting();
			await expectRevert.unspecified(this.VoteInstance.TaillingVotes({from: Voter1}));
		});

		it("Comptage des voix", async function(){
			await this.VoteInstance.EndVoting();
			var res = await this.VoteInstance.TaillingVotes({from: owner});

			let status = await this.VoteInstance.GetStatus();

			expect(status.words[0], "Status should be VotesTallied").to.equal(5);// Vérification que le statu est bien VotesTallied

			/*Vérification des events*/
			await expectEvent(res, "VotesTallied", {}, "VotesTallied event incorrect");
			await expectEvent(res, "WorkflowStatusChange", {previousStatus:"4" , newStatus:"5"}, "WorkflowStatusChange event incorrect");
			
			/*Vérification de la proposition gagnante*/
			var expectedWinningProposal = Winner([Choix1, Choix2, Choix3], 2);
			var actualWinningProposal = await this.VoteInstance.winningProposalid();
			expect(actualWinningProposal).to.be.bignumber.equal(new BN(expectedWinningProposal));
		});

	});

});
