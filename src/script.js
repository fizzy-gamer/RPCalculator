import { RPValues } from "./RPValues.js";
import { MoneyValues } from "./MoneyValues.js";
import { ItemIcons } from "./ItemIcons.js";

//Setup buttons
var ItemButtons = document.getElementById("ItemButtons");
for (let [ItemName, RPValue] of Object.entries(RPValues)) { 

  let Button = document.createElement("button");
  Button.className = "ItemButton";
  Button.id = RPValue;
  Button.value = ItemName;
  Button.onclick = function () {ItemClicked(Button);};
  ItemButtons.appendChild(Button);

  let ItemIcon = document.createElement("img");
  ItemIcon.src = ItemIcons[ItemName];
  ItemIcon.className = "ItemIcon";
  Button.appendChild(ItemIcon);

  let ButtonText = document.createElement("p");
  ButtonText.className = "ItemText";
  ButtonText.innerHTML = `${ItemName}: <span class="RPText"> ${Intl.NumberFormat("en-UK").format(RPValue)}RP</span>, <span class="GreenText">$${Intl.NumberFormat("en-UK").format(MoneyValues[ItemName])}</span>`
  Button.appendChild(ButtonText);
};

var CurrentStations = {};
var ResearchStationButtons = document.getElementById("ResearchStations")
function AddStation(Type, Amount, Item1, Item2, CurrentName) {
  let Offset = 1;
  let BaseName = CurrentName == null ? `${Type}:` : CurrentName;
  let Name = CurrentName == null ? `${BaseName}${Offset}` : CurrentName;
  while (CurrentStations[Name] != null) {
    Offset += 1;
    Name = `${BaseName}${Offset}`;
  };

  let Station = document.getElementById(Type).cloneNode(true);
  Station.id = "";
  Station.value = Name;
  Station.className = "Station";
  Station.querySelector("p").innerText = document.getElementById(Type).value;
  CurrentStations[Name] = {Station:Type, Amount: (Amount == null) ? 0 : Amount};
  ResearchStationButtons.appendChild(Station);

  let AmountInput = document.createElement("input");
  AmountInput.className = "AmountInput";
  AmountInput.placeholder = "Amount";
  AmountInput.type = "number";
  AmountInput.step = "1";
  AmountInput.min = "0";
  if (Amount != 0) {AmountInput.value = Amount;};
  AmountInput.addEventListener("input", function(){CurrentStations[Name].Amount = (parseFloat(AmountInput.value) == NaN) ? 0: parseFloat(AmountInput.value); Update();});
  Station.appendChild(AmountInput);

  if (Type.indexOf("2") >-1 || Type.indexOf("3") >-1 || Type.indexOf("4") >-1 || Type.indexOf("Satellite") >-1) {
    let ItemButton1 = document.createElement("button");
    ItemButton1.className = "StationItem";
    ItemButton1.innerText = (Item1 == null) ? "Click for Item!" : Item1;
    ItemButton1.id = `${Name}:Item1`;
    CurrentStations[Name]["Item1"] = (Item1 == null) ? "" : Item1;
    ItemButton1.onclick = function() {SelectStationItem(Name, "Item1")};
    Station.appendChild(ItemButton1);
  };

  if (Type.indexOf("3") >-1 || Type.indexOf("4") >-1) {
    let ItemButton2 = document.createElement("button");
    ItemButton2.className = "StationItem";
    ItemButton2.innerText = (Item2 == null) ? "Click for Item!" : Item2;
    ItemButton2.id = `${Name}:Item2`;
    CurrentStations[Name]["Item2"] = (Item2 == null) ? "" : Item2;
    ItemButton2.onclick = function() {SelectStationItem(Name, "Item2")};
    Station.appendChild(ItemButton2);
  };
}

//Button Handlers
document.getElementById("RS1").onclick = function() {AddStation("RS1");};
document.getElementById("RS2").onclick = function() {AddStation("RS2");};
document.getElementById("RS3").onclick = function() {AddStation("RS3");};
document.getElementById("RS4").onclick = function() {AddStation("RS4");};
document.getElementById("Satellite").onclick = function() {AddStation("Satellite");};

var CurrentRPInput = document.getElementById("CurrentRP");
var TargetRPInput = document.getElementById("TargetRP");
CurrentRPInput.addEventListener("input", function() {Update();});
TargetRPInput.addEventListener("input", function() {Update();});

//Sort
var Items = ItemButtons.children;
Items = Array.from(Items).sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
Items.forEach(Item => {ItemButtons.appendChild(Item);});

var ItemSearchInput = document.getElementById("ItemSearch");
function SearchFilter() {
  const Query = ItemSearchInput.value.toUpperCase();
  const Buttons = ItemButtons.getElementsByTagName("button");
  for (let i = 0; i < Buttons.length; i++) {
    let Value = Buttons[i].value;
    if (Value.toUpperCase().indexOf(Query) > -1) {
      Buttons[i].style.display = "";
    } else {
      Buttons[i].style.display = "none";
    };
  };
};
ItemSearchInput.onkeyup = function() {SearchFilter();};

//Mathz
function Round2DP(Number){
  return Math.round(Number*100)/100;
};

function CustomLog(Number,Base) {
  let Calculated = (Math.log(Number) / Math.log(Base))
  return Calculated == -Infinity ? 0 : Calculated;
};

function MathClamp(Number, Min, Max) {
  return Math.max(Min, Math.min(Number, Max));
};

var TextIndex = {
  "RPCap":          ["RPText", "RP Cap"],
  "BaseRPs" :       ["RPText", "RP/s - Original"],
  "CurrentRPs" :    ["RPText", "RP/s - Current"],
  "BuffRPs" :       ["RPText", "RP/s - When Minigame"],
  "BaseRPsBoost" :  ["RPText", "RP/s Boost (at 100% Efficiency) - Original"],
  "CurrentRPsBoost":["RPText", "RP/s Boost (at 100% Efficiency) - Current"],
  "HighestRP":      ["GreyText", "RP when RP/s is 1% of original or 10M RP"],
  "HighestRPTime":  ["GreyText", " seconds until RP/s is 1% of original or 10M RP"],
  "TargetRPTime":   ["GreyText", " seconds until Target RP is reached"],
  "Usage":          ["OrangeText", "u/s of the Item(s) required!"],
  "PowerKMF":       ["OrangeText", "KMF/s required!"],
  "PowerMMF":       ["OrangeText", "MMF/s required!"],
  "PercentBoost" :  ["RPText", "% Boost (at 100% Efficiency)"],
  "PowerSatellite": ["OrangeText", "KMF/s required for both Satellite Controllers and Dishes!"],
  "SatelliteUsage": ["OrangeText", "L/s of the Liquid required!"],
  "DishesRequired": ["RPText"," Satellite Dishes required for 100% Efficiency!"]
};

function CalculateCap(Teir, Amount) {
  if (Teir == 1) {
		return 200*CustomLog(Amount+1, 2);
  } else if (Teir == 2) {
		return 2000*CustomLog(Amount+1, 2);
  } else if (Teir == 3) {
		return 1.1*15000*(CustomLog(Amount+1, 2)+Math.sqrt(Amount));
  } else if (Teir == 4) {
		return 150000*(CustomLog(Amount+1, 2)+Math.pow(Amount, 0.9));
  };
};
function CalculateRPs(Teir, Amount, TotalRPValue, Cap, CurrentRP) {
  if (Cap == 0) {return 0};
  let Factor = Math.max((CurrentRP/Cap), 1);
  if (Teir == 1) {
		return Math.sqrt(Amount)*(10**(1-Factor));
  } else if (Teir == 2 || Teir == 3) {
    return 2*Math.pow(TotalRPValue, 0.6)*(10**(1-Factor));
  } else if (Teir == 4) {
    return 2*Math.pow(TotalRPValue, 0.6)*(10**(1-Math.sqrt(Factor)));
  };
};
function CalculateRS4Buff(Cap, Amount) {
  return Cap*0.000025*Amount;
};
function CalculateSatellite(Amount, TotalRPValue) {
  return [Math.sqrt(TotalRPValue*Amount)+Amount, 0.78 * Math.max(CustomLog(TotalRPValue+1,10),0) *100]; //[Satelites Required, Boost]
};

function Update() {
  let CurrentRP = (parseFloat(CurrentRPInput.value) >0) ?parseFloat(CurrentRPInput.value) :0;
  let TargetRP = (parseFloat(TargetRPInput.value) >0) ?parseFloat(TargetRPInput.value) :0;
  let UpdateStats = {
    "RS1":{"Amount":0, "TotalRPValue":0, "BaseRPs":0, "CurrentRPs":0, "RPCap":0, "HighestRP":0, "HighestRPTime":0, "TargetRPTime":0, "PowerKMF":0},
    "RS2":{"Amount":0, "TotalRPValue":0, "BaseRPs":0, "CurrentRPs":0, "RPCap":0, "HighestRP":0, "HighestRPTime":0, "TargetRPTime":0, "PowerKMF":0, "Usage":0},
    "RS3":{"RawAmount":0, "Amount":0, "TotalRPValue":0, "BaseRPs":0, "CurrentRPs":0, "RPCap":0, "HighestRP":0, "HighestRPTime":0, "TargetRPTime":0, "PowerMMF":0, "Usage":0, "Double":false},
    "RS4":{"RawAmount":0, "Amount":0, "TotalRPValue":0, "BaseRPs":0, "CurrentRPs":0, "BuffRPs":0, "RPCap":0, "HighestRP":0, "HighestRPTime":0, "TargetRPTime":0, "PowerMMF":0, "Usage":0, "Double":false},
    "Satellite":{"Amount":0, "TotalRPValue":0, "PercentBoost":0, "BaseRPsBoost":0, "CurrentRPsBoost":0, "HighestRP":0, "HighestRPTime":0, "TargetRPTime":0, "PowerSatellite":0, "SatelliteUsage":0, "DishesRequired":0}
  };
  Object.entries(CurrentStations).forEach(Station => {
    if (UpdateStats[Station[1].Station] == null) {return};

    if (Station[1].Station == "RS3" || Station[1].Station == "RS4") {
      let MoneyBuff = (((MoneyValues[Station[1].Item1]==null ?0 :MoneyValues[Station[1].Item1])+(MoneyValues[Station[1].Item2]==null ?0 :MoneyValues[Station[1].Item2]))/2) /600;
      if (MoneyBuff < 1) {
        MoneyBuff = CustomLog(MathClamp(MoneyBuff,0,1)+1,2);
      } else {
        MoneyBuff = CustomLog(MoneyBuff, 4)+1;
      };
      if (Station[1].Station == "RS4") {MoneyBuff *=2;}; //Logic Buff

      let TotalRP = (RPValues[Station[1].Item1]==null ?0 :RPValues[Station[1].Item1]) + (RPValues[Station[1].Item2]==null ?0 :RPValues[Station[1].Item2]);
      if (Station[1].Item1 == Station[1].Item2) {TotalRP *= 0.7; UpdateStats[Station[1].Station].Double = true;};

      UpdateStats[Station[1].Station].Amount += MoneyBuff * Station[1].Amount;
      UpdateStats[Station[1].Station].RawAmount += Station[1].Amount
      UpdateStats[Station[1].Station].TotalRPValue += TotalRP*Station[1].Amount;
    } else {
      UpdateStats[Station[1].Station].TotalRPValue += ((RPValues[Station[1].Item1]==null ?0 :RPValues[Station[1].Item1]) +(RPValues[Station[1].Item2]==null ?0 :RPValues[Station[1].Item2])) *Station[1].Amount;
      UpdateStats[Station[1].Station].Amount += Station[1].Amount;
    };
  });
  for (let i = 1; i <= 4; i++) {
    UpdateStats[`RS${i}`].RPCap = CalculateCap(i, UpdateStats[`RS${i}`].Amount);
    UpdateStats[`RS${i}`].BaseRPs = CalculateRPs(i, UpdateStats[`RS${i}`].Amount, UpdateStats[`RS${i}`].TotalRPValue, UpdateStats[`RS${i}`].RPCap, 0);
    UpdateStats[`RS${i}`].CurrentRPs = CalculateRPs(i, UpdateStats[`RS${i}`].Amount, UpdateStats[`RS${i}`].TotalRPValue, UpdateStats[`RS${i}`].RPCap, CurrentRP);
  };
  UpdateStats["RS4"].BuffRPs = CalculateRS4Buff(UpdateStats["RS4"].RPCap, UpdateStats["RS4"].RawAmount);
  UpdateStats["RS2"].Usage = UpdateStats["RS2"].Amount * 0.5;
  UpdateStats["RS3"].Usage = UpdateStats["RS3"].RawAmount * 0.2;
  UpdateStats["RS4"].Usage = UpdateStats["RS4"].RawAmount * 0.2;
  UpdateStats["RS1"].PowerKMF = UpdateStats["RS1"].Amount * 2.1;
  UpdateStats["RS2"].PowerKMF = UpdateStats["RS2"].Amount * 17;
  UpdateStats["RS3"].PowerMMF = UpdateStats["RS3"].RawAmount * 0.6;
  UpdateStats["RS4"].PowerMMF = UpdateStats["RS4"].RawAmount * 5;

  UpdateStats["Satellite"].DishesRequired = CalculateSatellite(UpdateStats["Satellite"].Amount, UpdateStats["Satellite"].TotalRPValue)[0];
  UpdateStats["Satellite"].PercentBoost = CalculateSatellite(UpdateStats["Satellite"].Amount, UpdateStats["Satellite"].TotalRPValue)[1];
  UpdateStats["Satellite"].BaseRPsBoost = (UpdateStats["RS1"].BaseRPs +UpdateStats["RS2"].BaseRPs +UpdateStats["RS3"].BaseRPs +UpdateStats["RS4"].BaseRPs +CalculateRS4Buff(UpdateStats["RS4"].RPCap, UpdateStats["RS4"].RawAmount)) * ((UpdateStats["Satellite"].PercentBoost/100)+1)
  UpdateStats["Satellite"].CurrentRPsBoost = (UpdateStats["RS1"].CurrentRPs +UpdateStats["RS2"].CurrentRPs +UpdateStats["RS3"].CurrentRPs +UpdateStats["RS4"].CurrentRPs +(CurrentRP < UpdateStats["RS4"].RPCap ?CalculateRS4Buff(UpdateStats["RS4"].RPCap, UpdateStats["RS4"].RawAmount) :0)) * ((UpdateStats["Satellite"].PercentBoost/100)+1)
  UpdateStats["Satellite"].SatelliteUsage = UpdateStats["Satellite"].Amount * 0.5;
  UpdateStats["Satellite"].PowerSatellite = (UpdateStats["Satellite"].Amount *75) + (UpdateStats["Satellite"].DishesRequired *75);

  let Trial = {
    "RS1":{"Min":UpdateStats["RS1"].BaseRPs*0.01, "RPs":UpdateStats["RS1"].CurrentRPs, "RP":CurrentRP, "Time":0},
    "RS2":{"Min":UpdateStats["RS2"].BaseRPs*0.01, "RPs":UpdateStats["RS2"].CurrentRPs, "RP":CurrentRP, "Time":0},
    "RS3":{"Min":UpdateStats["RS3"].BaseRPs*0.01, "RPs":UpdateStats["RS3"].CurrentRPs, "RP":CurrentRP, "Time":0},
    "RS4":{"Min":UpdateStats["RS4"].BaseRPs*0.01, "RPs":UpdateStats["RS4"].CurrentRPs, "RP":CurrentRP, "Time":0},
    "Satellite":{"Min":UpdateStats["Satellite"].BaseRPsBoost*0.01, "RPs":UpdateStats["Satellite"].CurrentRPsBoost, "RP":CurrentRP, "Time":0}
  };

  //RS1,2,3 Highest RP & Target Time
  for (let i = 1; i <= 3; i++) {
    let TargetTimeSet = false;
    while (Trial[`RS${i}`].RPs > Trial[`RS${i}`].Min && Trial[`RS${i}`].RPs > 0 && Trial[`RS${i}`].RP < 10000000) {
      Trial[`RS${i}`].RPs = CalculateRPs(i, UpdateStats[`RS${i}`].Amount, UpdateStats[`RS${i}`].TotalRPValue, UpdateStats[`RS${i}`].RPCap, Trial[`RS${i}`].RP);
      Trial[`RS${i}`].RP += Trial[`RS${i}`].RPs;
      Trial[`RS${i}`].Time += 1;
      if (TargetTimeSet == false && Trial[`RS${i}`].RP > TargetRP) {UpdateStats[`RS${i}`].TargetRPTime = Trial[`RS${i}`].Time; TargetTimeSet=true;};
    };
    UpdateStats[`RS${i}`].HighestRP = Trial[`RS${i}`].RP;
    UpdateStats[`RS${i}`].HighestRPTime = Trial[`RS${i}`].Time;
    if (TargetTimeSet == false) {UpdateStats[`RS${i}`].TargetRPTime = Infinity;};
  };
  //RS4 Highest RP & Target Time
  let RS4Buff = CalculateRS4Buff(UpdateStats["RS4"].RPCap, UpdateStats["RS4"].RawAmount);
  let RS4TargetTimeSet = false;
  while (Trial["RS4"].RPs > Trial["RS4"].Min && Trial["RS4"].RPs > 0 && Trial["RS4"].RP < 10000000) {
    Trial["RS4"].RPs = CalculateRPs(4, UpdateStats["RS4"].Amount, UpdateStats["RS4"].TotalRPValue, UpdateStats["RS4"].RPCap, Trial["RS4"].RP);
    Trial["RS4"].RP += Trial["RS4"].RPs + (Trial["RS4"].RP < UpdateStats["RS4"].RPCap ?RS4Buff :0);
    Trial["RS4"].Time += 1;
    if (RS4TargetTimeSet == false && Trial["RS4"].RP > TargetRP) {UpdateStats["RS4"].TargetRPTime = Trial["RS4"].Time; RS4TargetTimeSet=true;};
  };
  UpdateStats["RS4"].HighestRP = Trial["RS4"].RP;
  UpdateStats["RS4"].HighestRPTime = Trial["RS4"].Time;
  if (RS4TargetTimeSet == false) {UpdateStats["RS4"].TargetRPTime = Infinity;};

  //Satellite
  let SatelliteTargetTimeSet = false;
  while (Trial["Satellite"].RPs > Trial["Satellite"].Min && Trial["Satellite"].RPs > 0 && Trial["Satellite"].RP < 10000000) {
    let NewRS1RPs = CalculateRPs(1, UpdateStats["RS1"].Amount, UpdateStats["RS1"].TotalRPValue, UpdateStats["RS1"].RPCap, Trial["Satellite"].RP);
    let NewRS2RPs = CalculateRPs(2, UpdateStats["RS2"].Amount, UpdateStats["RS2"].TotalRPValue, UpdateStats["RS2"].RPCap, Trial["Satellite"].RP);
    let NewRS3RPs = CalculateRPs(3, UpdateStats["RS3"].Amount, UpdateStats["RS3"].TotalRPValue, UpdateStats["RS3"].RPCap, Trial["Satellite"].RP);
    let NewRS4RPs = CalculateRPs(4, UpdateStats["RS4"].Amount, UpdateStats["RS4"].TotalRPValue, UpdateStats["RS4"].RPCap, Trial["Satellite"].RP) + (Trial["Satellite"].RP < UpdateStats["RS4"].RPCap ?RS4Buff :0);
    Trial["Satellite"].RPs = (NewRS1RPs +NewRS2RPs +NewRS3RPs +NewRS4RPs) * ((UpdateStats["Satellite"].PercentBoost/100)+1);
    Trial["Satellite"].RP += Trial["Satellite"].RPs;
    Trial["Satellite"].Time +=1;
    if (SatelliteTargetTimeSet == false && Trial["Satellite"].RP > TargetRP) {UpdateStats["Satellite"].TargetRPTime = Trial["Satellite"].Time; SatelliteTargetTimeSet=true;};
  };
  UpdateStats["Satellite"].HighestRP = Trial["Satellite"].RP;
  UpdateStats["Satellite"].HighestRPTime = Trial["Satellite"].Time;
  if (SatelliteTargetTimeSet == false) {UpdateStats["Satellite"].TargetRPTime = Infinity;};

  Object.entries(UpdateStats).forEach(Station =>{
    let StationName = Station[0];
    Object.entries(Station[1]).forEach(Data =>{
      let TextElement = document.getElementById(`${StationName}${Data[0]}`);
      if (TextElement != null && TextIndex[Data[0]] != null) {
        TextElement.innerHTML = `<span class="${TextIndex[Data[0]][0]}">${Intl.NumberFormat("en-UK").format(Data[1])}${TextIndex[Data[0]][1]}</span>`;
      };
    });
  });
};
Update();

var StationItemSelection = {Name:"", Item:""};
var ItemMenu = document.getElementById("ItemMenu");
ItemMenu.addEventListener("click", function(event) {
  const Menu = document.getElementById("ItemBox");
  if (Menu && !Menu.contains(event.target)) {
    ItemMenu.style.display = "none";
    StationItemSelection.Name = "";
    StationItemSelection.Item = "";
  };
});
function SelectStationItem(Name, Item) {
  ItemMenu.style.display = "";
  StationItemSelection.Name = Name;
  StationItemSelection.Item = Item;
}
function ItemClicked(Button) {
  ItemMenu.style.display = "none";
  if (StationItemSelection.Name == "" || StationItemSelection.Item == "") {return;};
  CurrentStations[StationItemSelection.Name][StationItemSelection.Item] = Button.value;
  document.getElementById(`${StationItemSelection.Name}:${StationItemSelection.Item}`).innerText = Button.value;
  StationItemSelection.Name = "";
  StationItemSelection.Item = "";
  Update();
};

document.getElementById("ClearStations").onclick = function() {ClearStations(); Update();};
function ClearStations() {
  CurrentStations = {};
  Object.entries(ResearchStationButtons.children).forEach(Button =>{
    Button[1].remove();
  });
};

//////////////////////////////////////////////////////////////
//Import Export
document.getElementById("ImportData").onclick = function() {document.getElementById("ImportMenu").style.display = "";};
document.getElementById("ExportData").onclick = function() {ExportClicked();};
document.getElementById("Import").onclick = function() {ImportClicked();};
var DataInput = document.getElementById("ImportDataInput");

document.getElementById("ImportMenu").addEventListener("click", function(event) {
  const Menu = document.getElementById("ImportBox");
  if (Menu && !Menu.contains(event.target)) {document.getElementById("ImportMenu").style.display = "none";};
});

function ImportClicked() {
  try {
    let Data = DataInput.value.split("🔬");
    let ExtractedData = {};

    ClearStations();

    Data.forEach(StationToImport => {
      if (StationToImport == "") {return;};
      let CurrentStation = JSON.parse(StationToImport);
      let Name = CurrentStation[0];
      let StationValues = CurrentStation[1];
      if (StationValues.Station == null) {return;};
      if (StationValues.Amount == null) {StationValues.Amount = 0;};
      if (RPValues[StationValues.Item1] == null) {StationValues.Item1 = null;};
      if (RPValues[StationValues.Item2] == null) {StationValues.Item2 = null;};
      ExtractedData[Name] = {Station:StationValues.Station,Amount:StationValues.Amount, "Item1":StationValues.Item1==null?"":StationValues.Item1, "Item2":StationValues.Item2==null?"":StationValues.Item2};
      AddStation(StationValues.Station, StationValues.Amount, StationValues.Item1, StationValues.Item2, Name);
    });

    CurrentStations = ExtractedData;
    document.getElementById('ImportMenu').style.display = 'none';
    Update();

  } catch {
    DataInput.value = "Invalid, Try exporting to see format!";
  };
};

function ExportClicked() {
  let ExportText = "";
  Object.entries(CurrentStations).forEach(function(Data){
    ExportText += `${JSON.stringify(Data)}🔬\n`;
  });
  navigator.clipboard.writeText(ExportText);
  document.getElementById("ExportData").innerText = "Copied to clipboard!";
  setTimeout(_ => {
  document.getElementById("ExportData").innerText = "Export Data";
  }, 2000);
};

//////////////////////////////////////////////////////////////
