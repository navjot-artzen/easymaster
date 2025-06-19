const ymmData = {
  Toyota: {
    Corolla: [2020, 2021],
    Camry: [2019, 2020],
  },
  Honda: {
    Civic: [2020, 2022],
    Accord: [2021],
  },
};

function handleMakeChange(make) {
  const modelSelect = document.getElementById("ymm-model");
  const yearSelect = document.getElementById("ymm-year");
  modelSelect.innerHTML = "<option>- Model -</option>";
  yearSelect.innerHTML = "<option>- Year -</option>";
  yearSelect.disabled = true;

  if (!ymmData[make]) return;

  modelSelect.disabled = false;
  Object.keys(ymmData[make]).forEach((model) => {
    modelSelect.innerHTML += `<option value="${model}">${model}</option>`;
  });

  modelSelect.onchange = () => {
    yearSelect.innerHTML = "<option>- Year -</option>";
    yearSelect.disabled = false;
    ymmData[make][modelSelect.value].forEach((year) => {
      yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
  };
}

function handleSearch() {
  const make = document.getElementById("ymm-make").value;
  const model = document.getElementById("ymm-model").value;
  const year = document.getElementById("ymm-year").value;

  const query = `?make=${make}&model=${model}&year=${year}`;
  window.location.href = "/collections/all" + query; // customize this route
}

function clearFilters() {
  document.getElementById("ymm-make").selectedIndex = 0;
  document.getElementById("ymm-model").innerHTML = "<option>- Model -</option>";
  document.getElementById("ymm-model").disabled = true;
  document.getElementById("ymm-year").innerHTML = "<option>- Year -</option>";
  document.getElementById("ymm-year").disabled = true;
}
