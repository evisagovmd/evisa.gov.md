function checkVisa(){

var visa=document.getElementById("visa").value.trim();
var passport=document.getElementById("passport").value.trim();
var robot=document.getElementById("robot").checked;

if(!robot){
alert("Please confirm you are not a robot");
return;
}

fetch("visas.json")
.then(response => response.json())
.then(data => {

var records=data.records;

var found=false;

for(var i=0;i<records.length;i++){

if(records[i].visa_number==visa && records[i].passport==passport){

showResult(records[i]);

found=true;

break;

}

}

if(!found){

document.getElementById("result").innerHTML=
"<div class='result-error'>No visa record found</div>";

}

});

}



function showResult(record){

var result=document.getElementById("result");

result.innerHTML = `

<div class="result-card">

<div class="result-header">Seeking visa</div>

<div class="result-content">

<div class="result-photo">
<img src="${record.photo}">
</div>

<div class="result-info">

<p>Surname: <b>${record.surname}</b></p>
<p>First name: <b>${record.firstname}</b></p>
<p>Date of birth: <b>${record.dob}</b></p>
<p>Citizenship: <b>${record.citizenship}</b></p>
<p>Passport number: <b>${record.passport}</b></p>

<br>

<p>Visa status: <span class="visa-cancelled">${record.status}</span></p>
<p>Visa validity: <b>${record.validity}</b></p>
<p>Visa type: <b>${record.visatype}</b></p>
<p>Visit purpose: <b>${record.purpose}</b></p>

</div>

</div>

<button class="search-again" onclick="location.reload()">Another search</button>

</div>

`;

}
