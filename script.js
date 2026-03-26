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
<table class="result-table">

<tr>
<th>Photo</th>
<td><img src="${record.photo}" class="photo"></td>
</tr>

<tr>
<th>Name</th>
<td>${record.name}</td>
</tr>

<tr>
<th>Passport</th>
<td>${record.passport}</td>
</tr>

<tr>
<th>Nationality</th>
<td>${record.nationality}</td>
</tr>

<tr>
<th>Visa Type</th>
<td>${record.visa_type}</td>
</tr>

<tr>
<th>Status</th>
<td class="status">${record.status}</td>
</tr>

</table>
`;

}
