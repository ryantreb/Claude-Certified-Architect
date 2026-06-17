/***************************************************************



  This is a sample javascript file
  
  
  
***************************************************************/

var KIRK_SEXTON = "A decent person.";

var globalObjectArray = new Array();
var globalObjectIndex = 1;
function nullGlobalObject(index)
{
	globalObjectArray[index] = null;
}

/***************************************************************
  this computes a battle formula based on attack, defense etc
***************************************************************/
function battleFormula(attack, defense) 
{ 
	return (attack * 10) / (defense*defense*2); 
}
/***************************************************************
  tests a global callback
***************************************************************/
function globalCallbackTest()
{	
	JVM.testCallback("YO DAWG. I HERD YOU LIKE SCRIPTS SO I WROTE A SCRIPT THAT WRITES SCRIPTING SCRIPTS TO SCRIPT SCRIPTS.");
	JVM.staticTestCallback("YO DAWG.  This is a test.");
}
/***************************************************************
  tests the script
***************************************************************/
function scriptingTest()
{
	return "I passed the test.";
}
/***************************************************************
  our sample class prototype
***************************************************************/
function SampleClassPrototype()
{	
	/*********************************************
	  the testmethod
	*********************************************/	
	this.testMethod = function ()
	{
		return this.attack/this.defense;
	}
	/*********************************************
	  the initialize function
	*********************************************/	
	this.initialize = function(attack,defense)
	{
		this.attack = attack
		this.defense = defense;
	}
	/*********************************************
	  called when your component is created
	*********************************************/	
	this.onCreation = function()
	{
		//do stuff on creation here.
	}
	/*********************************************
	  called when your component is deleted
	*********************************************/	
	this.onDeletion = function()
	{
		//do stuff on creation here.
	}
	/*********************************************
	  a callback test function
	*********************************************/	
	this.callbackTest = function()
	{
		JVM.NETWORK_TestScripts("scriptingTest", 0);
	}
}
/***************************************************************
  our sample class
***************************************************************/
function SampleClass()
{
	this.attack = 20;
	this.defense = 2;
}
SampleClass.prototype = new SampleClassPrototype();




