import { RPValues } from "./RPValues.js";
import { MoneyValues } from "./MoneyValues.js";
import { ItemIcons } from "./ItemIcons.js";
import { FluidNames } from "./Fluids.js";

//Setup buttons
var ItemButtons = document.getElementById("ItemButtons");
for (let [ItemName, RPValue] of Object.entries(RPValues)) { 
  if (FluidNames.includes(ItemName)==true) {continue};

  let Button = document.createElement("button");
  Button.className = "DeselectedButton";
  Button.id = RPValue;
  Button.value = ItemName;
  Button.onclick = function () {
    ItemClicked(Button);
  };
  ItemButtons.appendChild(Button);

  let ButtonIcon = document.createElement("img");
  ButtonIcon.src = ItemIcons[ItemName];
  ButtonIcon.className = "ItemIcon";
  Button.appendChild(ButtonIcon);

  let ButtonText = document.createElement("p");
  ButtonText.className = "ItemText";
  ButtonText.innerHTML = ItemName + ': <span class="RPText">' + RPValue + "RP</span>" + ', <span class="MoneyText">$' + MoneyValues[ItemName].toString() + "</span>"
  Button.appendChild(ButtonText);
};

var FluidButtons = document.getElementById("FluidButtons");
FluidNames.forEach(FluidName => {
  let Button = document.createElement("button");
  Button.className = "DeselectedButton";
  Button.id = RPValues[FluidName];
  Button.value = FluidName;
  Button.onclick = function () {
    FluidClicked(Button);
  };
  FluidButtons.appendChild(Button);

  let ButtonIcon = document.createElement("img");
  ButtonIcon.src = ItemIcons[FluidName];
  ButtonIcon.className = "ItemIcon";
  Button.appendChild(ButtonIcon);

  let ButtonText = document.createElement("p");
  ButtonText.className = "ItemText";
  ButtonText.innerHTML = FluidName + ': <span class="RPText">' + RPValues[FluidName] + "RP</span>" + ', <span class="MoneyText">$' + MoneyValues[FluidName].toString() + "</span>"
  Button.appendChild(ButtonText);
});

//Button Handlers
document.getElementById("DeselectAllItemButton").onclick = function() {DeselectAllItems();};
document.getElementById("DeselectAllFluidButton").onclick = function() {DeselectAllFluids();};

document.getElementById("RS2Mode").onclick = function() {SetMode("RS2");};
document.getElementById("RS3Mode").onclick = function() {SetMode("RS3");};
document.getElementById("RS3BothMode").onclick = function() {SetMode("RS3Both");};

document.getElementById("CurrentRPAmount").addEventListener("input", function() {Update();});
document.getElementById("TargetRPAmount").addEventListener("input", function() {Update();});
document.getElementById("RS2Amount").addEventListener("input", function() {document.getElementById("RS2Mode").className = "SelectionDisabled"; SetMode("RS2");});
document.getElementById("RS3Amount").addEventListener("input", function() {document.getElementById("RS3Mode").className = "SelectionDisabled"; SetMode("RS3");});
document.getElementById("RS4Amount").addEventListener("input", function() {document.getElementById("RS3Mode").className = "SelectionDisabled"; SetMode("RS3");});
document.getElementById("SatelliteControllerAmount").addEventListener("input", function() {Update();});

//Sort
var Items = ItemButtons.children;
Items = Array.from(Items).sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
Items.forEach(Item => {ItemButtons.appendChild(Item);});

var Fluids = FluidButtons.children;
Fluids = Array.from(Fluids).sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
Fluids.forEach(Fluid => {FluidButtons.appendChild(Fluid);});

//Mathz
var ItemAmountSelectedText = document.getElementById("ItemAmountSelected");
var CurrentRPAmountInput = document.getElementById("CurrentRPAmount");
var TargetRPAmountInput = document.getElementById("TargetRPAmount");

var Selected = {"RS2":[],"RS3":[],"RS3Both":[],"SatelliteController":[]};
var SelectedTexts = {
  "RS2":"/1 Selected",
  "RS3":"/2 Selected",
  "RS3Both":"/1 Selected"
};

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
  "RPsBoost" :      ["RPText", "RP/s Boost (at 100% Efficiency)"],
  "BuffRPs" :       ["RPText", "RP/s - When Minigame"],
  "HighestRP":      ["GreyText", "RP when RP/s is 1% of original or 10M RP"],
  "HighestRPTime":  ["GreyText", " seconds until RP/s is 1% of original or 10M RP"],
  "TargetRPTime":   ["GreyText", " seconds until Target RP is reached"],
  "Usage":          ["OrangeText", "u/s of the Item required!"],
  "DishesRequired": ["RPText"," Satellite Dishes required for 100% Efficiency!"],
  "SatelliteUsage": ["OrangeText", "L/s of the Liquid required!"]
}

var RS2Stats = {
  "RPCap":0,
  "BaseRPs":0,
  "CurrentRPs":0,
  "HighestRP":0,
  "HighestRPTime":0,
  "TargetRPTime":0,
  "Usage":0
};

var RS3Stats = {
  "BaseRPCap":0,
  "RPCap":0,
  "CapFactor":0,
  "BaseRPs":0,
  "CurrentRPs":0,
  "HighestRP":0,
  "HighestRPTime":0,
  "TargetRPTime":0,
  "Usage":0
};

var RS4Stats = {
  "BaseRPCap":0,
  "RPCap":0,
  "CapFactor":0,
  "BaseRPs":0,
  "CurrentRPs":0,
  "BuffRPs":0,
  "HighestRP":0,
  "HighestRPTime":0,
  "TargetRPTime":0
};

var SatelliteStats = {
  "DishesRequired":0,
  "SatelliteUsage":0,
  "BaseRPsBoost":0,
  "RPsBoost":0,
  "HighestRP":0,
  "HighestRPTime":0,
  "TargetRPTime":0
};

var OverallStats = {
  "HighestRP":0,
  "HighestRPTime":0,
  "RS2Usage":0,
  "RS3Usage":0
}

let AllStatTables = {
  "RS2":RS2Stats,
  "RS3":RS3Stats,
  "RS4":RS4Stats,
  "Satellite":SatelliteStats
};

function CheckRPs(RSSatTable) {
  let CurrentRP = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  if (RSSatTable["BaseRPs"] > 0 && CurrentRP > RSSatTable["RPCap"]) {
    let TestingRP = RSSatTable["RPCap"];
    while (TestingRP < CurrentRP) {
      TestingRP += RSSatTable["CurrentRPs"];
      RSSatTable["CurrentRPs"] = RSSatTable["BaseRPs"]*(10**(1-((TestingRP/RSSatTable["RPCap"]) >1 ? TestingRP/RSSatTable["RPCap"] : 1)));
      if (RSSatTable["CurrentRPs"] <= RSSatTable["BaseRPs"]*0.01) {break};
    };
  } else {
    RSSatTable["CurrentRPs"] = RSSatTable["BaseRPs"];
  };
};

function CalculateRS2(RPValue, RS2s){
  RS2Stats["Usage"] = RS2s*0.5;
  RS2Stats["BaseRPs"] = 2*((RPValue*RS2s)**0.6);
  RS2Stats["RPCap"] = RS2s>0 ? 2000*(CustomLog((RS2s+1),2)): 0;
  CheckRPs(RS2Stats);
};

function CalculateRS3(RPValue1,RPValue2,MoneyValue1,MoneyValue2, RS3s, SameItems){
  let TotalRPValue = RPValue1+RPValue2;
  RS3Stats["Usage"] = RS3s*0.1;

  if (SameItems == true) {
    TotalRPValue *=0.7;
    RS3Stats["Usage"] = RS3s*0.2;
  };

  let AverageMoney = (MoneyValue1+MoneyValue2)/2;
  RS3Stats["CapFactor"] = AverageMoney/600;
  if (RS3Stats["CapFactor"] >= 1) {
    RS3Stats["CapFactor"] = CustomLog(RS3Stats["CapFactor"], 4) +1;
  } else if (RS3Stats["CapFactor"] < 1) {
    RS3Stats["CapFactor"] = CustomLog((MathClamp(RS3Stats["CapFactor"], -0, 1) +1), 2);
  };
  RS3Stats["CapFactor"] *= RS3s;

  RS3Stats["BaseRPCap"] = 1.1*15000*(CustomLog((RS3Stats["CapFactor"]+1),2) + Math.sqrt(RS3Stats["CapFactor"]));
  RS3Stats["RPCap"] = RS3Stats["BaseRPCap"];
  

  RS3Stats["BaseRPs"] = 2*((TotalRPValue*RS3s)**0.6);
  CheckRPs(RS3Stats);
};

function CalculateRS4(RPValue1,RPValue2,MoneyValue1,MoneyValue2, RS4s, SameItems){
  let TotalRPValue = RPValue1+RPValue2;

  if (SameItems == true) {
    TotalRPValue *=0.7;
  };

  let AverageMoney = (MoneyValue1+MoneyValue2)/2;
  RS4Stats["CapFactor"] = AverageMoney/600;
  if (RS4Stats["CapFactor"] >= 1) {
    RS4Stats["CapFactor"] = CustomLog(RS4Stats["CapFactor"], 4) +1;
  } else if (RS4Stats["CapFactor"] < 1) {
    RS4Stats["CapFactor"] = CustomLog((MathClamp(RS4Stats["CapFactor"], -0, 1) +1), 2);
  };
  RS4Stats["CapFactor"] *= RS4s;
  RS4Stats["CapFactor"] *= 2;

  RS4Stats["BaseRPCap"] = 150000*(CustomLog(RS4Stats["CapFactor"]+1, 2)+(RS4Stats["CapFactor"]**0.9));
  RS4Stats["RPCap"] = RS4Stats["BaseRPCap"];
  
  RS4Stats["BaseRPs"] = (2*((TotalRPValue)**0.6));
  RS4Stats["BuffRPs"] = RS4Stats["BaseRPs"] + (RS4Stats["RPCap"]*0.000025*RS4s)
  
  let CurrentRP = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  let TestingRP = 0;
  if (CurrentRP > RS4Stats["RPCap"] && RS4Stats["BaseRPs"] > 0) {
    while (TestingRP < RS4Stats["RPCap"]) {
      TestingRP += RS4Stats["BuffRPs"];
    };
    while (TestingRP < CurrentRP) {
      TestingRP += RS4Stats["CurrentRPs"];
      RS4Stats["CurrentRPs"] = (RS4Stats["BaseRPs"])*(10**(1-(Math.sqrt(((TestingRP/RS4Stats["RPCap"]) > 1 ? (TestingRP/RS4Stats["RPCap"]) : 1)))));
      if (RS4Stats["CurrentRPs"] <= RS4Stats["BaseRPs"]*0.01) {break};
    };
  } else {
    RS4Stats["CurrentRPs"] = RS4Stats["BuffRPs"];
  };
};  

function CalculateSatellite(RPValue, Controllers) {
  SatelliteStats["TotalRPValue"] = RPValue*Controllers;
  SatelliteStats["DishesRequired"] = Math.sqrt(SatelliteStats["TotalRPValue"]*Controllers)+Controllers;
  SatelliteStats["SatelliteUsage"] = Controllers*0.5;
  SatelliteStats["BaseRPsBoost"] = 0.78 * (RS2Stats["BaseRPs"] + RS3Stats["BaseRPs"] + RS4Stats["BaseRPs"]) * CustomLog(SatelliteStats["TotalRPValue"]+1,10);
  SatelliteStats["RPsBoost"] = 0.78 * (RS2Stats["CurrentRPs"] + RS3Stats["CurrentRPs"] + RS4Stats["CurrentRPs"]) * CustomLog(SatelliteStats["TotalRPValue"]+1,10);
};

function CalculateHighestRates() {
  let TargetRPAmount = parseFloat(TargetRPAmountInput.value)>0 ? parseFloat(TargetRPAmountInput.value): 0;

  RS2Stats["HighestRP"] = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  RS2Stats["HighestRPTime"] = 0;
  if (RS2Stats["BaseRPs"] > 0) {
    let RS2TestRPs = RS2Stats["CurrentRPs"];
    let RS2BaseRPs = RS2Stats["BaseRPs"];
    let RS2RPCap = RS2Stats["RPCap"];
    let SetTargetRPTime = false;
    while (RS2TestRPs > (RS2Stats["BaseRPs"]*0.01) && RS3Stats["HighestRP"] < 10000000) {
      RS2Stats["HighestRPTime"] +=1;
      RS2Stats["HighestRP"] += RS2TestRPs;
      RS2TestRPs = RS2BaseRPs*(10**(1-((RS2Stats["HighestRP"]/RS2RPCap) > 1 ? RS2Stats["HighestRP"]/RS2RPCap : 1)));
      if (RS2Stats["HighestRP"] >= TargetRPAmount && SetTargetRPTime == false) {RS2Stats["TargetRPTime"] = RS2Stats["HighestRPTime"]; SetTargetRPTime = true;};
    };
    if (SetTargetRPTime == false) {RS2Stats["TargetRPTime"] = Infinity;};
  };

  RS3Stats["HighestRP"] = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  RS3Stats["HighestRPTime"] = 0;
  if (RS3Stats["BaseRPs"] > 0) {
    let RS3TestRPs = RS3Stats["CurrentRPs"];
    let RS3BaseRPs = RS3Stats["BaseRPs"];
    let RS3RPCap = RS3Stats["RPCap"];
    let SetTargetRPTime = false;
    while ((RS3TestRPs > (RS3Stats["BaseRPs"]*0.01)) && (RS3Stats["HighestRP"] < 10000000)) {
      RS3Stats["HighestRPTime"] +=1;
      RS3Stats["HighestRP"] += RS3TestRPs;
      RS3TestRPs = RS3BaseRPs*(10**(1-((RS3Stats["HighestRP"]/RS3RPCap) > 1 ? RS3Stats["HighestRP"]/RS3RPCap : 1)));
      if (RS3Stats["HighestRP"] >= TargetRPAmount && SetTargetRPTime == false) {RS3Stats["TargetRPTime"] = RS3Stats["HighestRPTime"]; SetTargetRPTime = true;};
    };
    if (SetTargetRPTime == false) {RS3Stats["TargetRPTime"] = Infinity;};
  };

  RS4Stats["HighestRP"] = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  RS4Stats["HighestRPTime"] = 0;
  if (RS4Stats["BaseRPs"] > 0) {
    let RS4TestRPs = RS4Stats["BaseRPs"];
    let RS4BaseRPs = RS4Stats["BaseRPs"];
    let RS4RPCap = RS4Stats["RPCap"];
    let SetTargetRPTime = false;

    while (RS4Stats["HighestRP"] < RS4RPCap && RS4Stats["HighestRP"] < 10000000) {
      RS4Stats["HighestRP"] += RS4Stats["BuffRPs"];
      RS4Stats["HighestRPTime"] +=1;
      if (RS4Stats["HighestRP"] >= TargetRPAmount && SetTargetRPTime == false) {RS4Stats["TargetRPTime"] = RS4Stats["HighestRPTime"]; SetTargetRPTime = true;};
    };
    while (RS4TestRPs > (RS4BaseRPs*0.01) && RS4Stats["HighestRP"] < 10000000) {
      RS4Stats["HighestRP"] += RS4TestRPs;
      RS4Stats["HighestRPTime"] +=1;
      let RS4Factor = RS4Stats["HighestRP"]/RS4RPCap
      RS4TestRPs = RS4BaseRPs*(10**(1-(Math.sqrt((RS4Factor > 1 ? RS4Factor : 1)))));
      if (RS4Stats["HighestRP"] >= TargetRPAmount && SetTargetRPTime == false) {RS4Stats["TargetRPTime"] = RS4Stats["HighestRPTime"]; SetTargetRPTime = true;};
    };
    if (SetTargetRPTime == false) {RS4Stats["TargetRPTime"] = Infinity;};
  };

  SatelliteStats["HighestRP"] = parseFloat(CurrentRPAmountInput.value)>0 ? parseFloat(CurrentRPAmountInput.value): 0;
  SatelliteStats["HighestRPTime"] = 0;
  if ((RS2Stats["BaseRPs"] > 0 || RS3Stats["BaseRPs"] > 0 || RS4Stats["BaseRPs"] > 0) && SatelliteStats["BaseRPsBoost"] > 0) {
    let RS2TestRPs = RS2Stats["CurrentRPs"];
    let RS3TestRPs = RS3Stats["CurrentRPs"];
    let RS4TestRPs = RS4Stats["CurrentRPs"];
    let TestRPsBoost = SatelliteStats["RPsBoost"];
    let SetTargetRPTime = false;

    while ((RS2TestRPs > (RS2Stats["BaseRPs"]*0.01) || RS3TestRPs > (RS3Stats["BaseRPs"]*0.01) || RS4TestRPs > (RS4Stats["BaseRPs"]*0.01)) && SatelliteStats["HighestRP"] < 10000000) {
      SatelliteStats["HighestRPTime"] +=1;
      SatelliteStats["HighestRP"] += (RS2TestRPs+RS3TestRPs+RS4TestRPs+TestRPsBoost);

      let RS2Factor = SatelliteStats["HighestRP"]/RS2Stats["RPCap"];
      RS2TestRPs = RS2Stats["BaseRPs"]*(10**(1-(RS2Factor > 1 ? RS2Factor : 1)));

      let RS3Factor = SatelliteStats["HighestRP"]/RS3Stats["RPCap"];
      RS3TestRPs = RS3Stats["BaseRPs"]*(10**(1-(RS3Factor > 1 ? RS3Factor : 1)));

      if (SatelliteStats["HighestRP"] < RS4Stats["RPCap"]) {
        RS4TestRPs = RS4Stats["BuffRPs"];
      } else {
        let RS4Factor = SatelliteStats["HighestRP"]/RS4Stats["RPCap"];
        RS4TestRPs = RS4Stats["BaseRPs"]*(10**(1-(Math.sqrt((RS4Factor > 1 ? RS4Factor : 1)))));
      };

      TestRPsBoost = 0.78 * (RS2TestRPs+RS3TestRPs+RS4TestRPs) * CustomLog(SatelliteStats["TotalRPValue"]+1,10);
      if (SatelliteStats["HighestRP"] >= TargetRPAmount && SetTargetRPTime == false) {SatelliteStats["TargetRPTime"] = SatelliteStats["HighestRPTime"]; SetTargetRPTime = true;};
    };
    if (SetTargetRPTime == false) {SatelliteStats["TargetRPTime"] = Infinity;};
  };
};

function Update() {
  let RPValue1 = 0;
  let RPValue2 = 0;
  let MoneyValue1 = 0;
  let MoneyValue2 = 0;
  let SameItems = false;

  if ((CurrentMode=="RS2" || CurrentMode == "RS3") && Selected["RS3"].length >= 2) {
    RPValue1 = RPValues[Selected["RS3"][0].value];
    RPValue2 = RPValues[Selected["RS3"][1].value];
    MoneyValue1 = MoneyValues[Selected["RS3"][0].value];
    MoneyValue2 = MoneyValues[Selected["RS3"][1].value];
    document.getElementById("RS3DoubleItems").innerText = "";

  } else if (CurrentMode == "RS3") {
    RPValue1,RPValue2,MoneyValue1,MoneyValue2 = 0;
    document.getElementById("RS3DoubleItems").innerText = "";

  } else if (CurrentMode == "RS3Both") {
    RPValue1, RPValue2 = Selected[CurrentMode].length > 0 ? RPValues[Selected[CurrentMode][0].value] : 0 ;
    MoneyValue1, MoneyValue2 = Selected[CurrentMode].length > 0 ? MoneyValues[Selected[CurrentMode][0].value] : 0 ;
    SameItems = true;
    document.getElementById("RS3DoubleItems").innerText = "RS3s Suffer a 30% production loss from the same items!";
  };

  let RS2Amount = parseFloat(document.getElementById("RS2Amount").value);
  if (RS2Amount > 0) {
    CalculateRS2((Selected[CurrentMode].length > 0 ? RPValues[Selected[CurrentMode][0].value] : 0), RS2Amount);
  } else {CalculateRS2(0,0)};
  
  let RS3Amount = parseFloat(document.getElementById("RS3Amount").value);
  if (RS3Amount > 0) {
    CalculateRS3(RPValue1, RPValue2, MoneyValue1, MoneyValue2, RS3Amount, SameItems);
  } else {CalculateRS3(0,0,0,0,0,false)};
  
  let RS4Amount = parseFloat(document.getElementById("RS4Amount").value);
  if (RS4Amount > 0) {
    CalculateRS4(RPValue1, RPValue2, MoneyValue1, MoneyValue2, RS4Amount, SameItems);
  } else {CalculateRS4(0,0,0,0,0,false)};

  let SatelliteControllerAmount = parseFloat(document.getElementById("SatelliteControllerAmount").value);
  if (SatelliteControllerAmount > 0) {
    CalculateSatellite(Selected["SatelliteController"].length > 0 ? RPValues[Selected["SatelliteController"][0].value] : 0, (SatelliteControllerAmount > 0 ? SatelliteControllerAmount : 0));
  };

  CalculateHighestRates();

  ItemAmountSelectedText.innerText = Selected[CurrentMode].length + SelectedTexts[CurrentMode];
  if (Selected[CurrentMode].length > 0) {
    let CurrentItemSelectedText = "Selected: ";
    let AddedComma = false;
    Selected[CurrentMode].forEach(ItemButton => {
      CurrentItemSelectedText += ItemButton.value;
      if (Selected[CurrentMode].length >= 2 && AddedComma == false) {
        CurrentItemSelectedText += ", ";
        AddedComma = true;
      };
    });
    document.getElementById("ItemSelected").innerText = CurrentItemSelectedText;
  } else {
    document.getElementById("ItemSelected").innerText = "Selected: None";
  };

  document.getElementById("FluidAmountSelected").innerText = Selected["SatelliteController"].length + "/1 Selected";
  document.getElementById("FluidSelected").innerText = Selected["SatelliteController"].length > 0 ? ("Selected: "+Selected["SatelliteController"][0].value) : "Selected: None";

  Object.entries(AllStatTables).forEach(function(StatTableData){ //Data[0] = Index, Data[1] = Value
    Object.entries(StatTableData[1]).forEach(function(Data){ //Data[0] = Index, Data[1] = Value
      if (document.getElementById(StatTableData[0]+Data[0])) {
        document.getElementById(StatTableData[0]+Data[0]).innerHTML = '<span class="'+TextIndex[Data[0]][0]+'">'+Round2DP(Data[1])+TextIndex[Data[0]][1]+"</span>";
      };
    });
  });
};

function UpdateIcons() {
  if (Selected[CurrentMode].length > 0) {
    Items.forEach(Item => {
      Item.className="DeselectedButton";
    });
    Selected[CurrentMode].forEach(SelectedItem => {
      SelectedItem.className="SelectedButton"
    });
  } else {
    Items.forEach(Item => {
      Item.className="DeselectedButton";
    });
  };
};

//Item Clicked
var CurrentMode = "";
var ModesToDisable = {
  "RS2":["RS3Mode","RS3BothMode"],
  "RS3":["RS2Mode","RS3BothMode"],
  "RS3Both":["RS2Mode","RS3Mode"]
};

function SetMode(Mode) {
  if (document.getElementById(Mode+"Mode").className == "SelectionDisabled") {
    document.getElementById(Mode+"Mode").className = "SelectionEnabled";
    CurrentMode = Mode;
    Array.from(ModesToDisable[Mode]).forEach(ModeToDisable => {
      document.getElementById(ModeToDisable).className = "SelectionDisabled"
    });
    UpdateIcons();
    Update();
  };
};
SetMode("RS3");
SetMode("RS2");

function ItemClicked(Button) {
  if (Button.className == "DeselectedButton") {
    if (CurrentMode == "RS2" || CurrentMode == "RS3Both") {
      if (Selected[CurrentMode].length > 0) {
        Selected[CurrentMode][0].className = "DeselectedButton";
        Selected[CurrentMode] = [];
      };
      Selected[CurrentMode].push(Button);
    } else if (CurrentMode == "RS3") {
      if (Selected[CurrentMode].length >= 2) {
        Selected[CurrentMode][0].className = "DeselectedButton";
        Selected[CurrentMode].splice(0, 1);
      };
      Selected[CurrentMode].push(Button);
    };
    Button.className = "SelectedButton";

  } else if (Button.className == "SelectedButton") {
    Button.className = "DeselectedButton";
    Selected[CurrentMode].forEach(function (Item, Index) {
      if (Item == Button) {
        Selected[CurrentMode].splice(Index, 1);
      };
    });
  };
  
  Update();
};

function FluidClicked(Button) {
  if (Button.className == "DeselectedButton") {
    if (Selected["SatelliteController"].length > 0) {
      Selected["SatelliteController"][0].className = "DeselectedButton";
       Selected["SatelliteController"] = [];
    };
    Selected["SatelliteController"].push(Button);
    Button.className = "SelectedButton";

  } else if (Button.className == "SelectedButton") {
    Button.className = "DeselectedButton";
    Selected["SatelliteController"].forEach(function (Item, Index) {
      if (Item == Button) {
        Selected["SatelliteController"].splice(Index, 1);
      };
    });
  };
  Update()
};

function DeselectAllItems() {
  Selected[CurrentMode] = [];
  Items.forEach(Item => {
    Item.className = "DeselectedButton";
  });
  Update();
};

function DeselectAllFluids() {
  Selected["SatelliteController"] = [];
  Fluids.forEach(Fluid => {
    Fluid.className = "DeselectedButton";
  });
  Update();
};