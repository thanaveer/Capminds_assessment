


var STORAGE_KEY = "capminds_appointments";

var MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

var currentCalendarDate = new Date();

// local strg

function getAppointments() {
  var data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data);
}

function saveAppointments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateId() {
  return "apt_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}



function toDateInputValue(date) {
  var year = date.getFullYear();
  var month = pad2(date.getMonth() + 1);
  var day = pad2(date.getDate());
  return year + "-" + month + "-" + day;
}

function pad2(num) {
  return num < 10 ? "0" + num : "" + num;
}

/* Turns "2023-01-18" into "January 18, 2023" */
function formatDateNice(dateString) {
  var parts = dateString.split("-");
  var year = parseInt(parts[0], 10);
  var monthIndex = parseInt(parts[1], 10) - 1;
  var day = parseInt(parts[2], 10);
  return MONTH_NAMES[monthIndex] + " " + day + ", " + year;
}

/* Turns "14:30" into "02:30 PM" */
function formatTimeNice(timeString) {
  if (!timeString) {
    return "";
  }
  var parts = timeString.split(":");
  var hours = parseInt(parts[0], 10);
  var minutes = parts[1];
  var suffix = hours >= 12 ? "PM" : "AM";
  var hours12 = hours % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }
  return pad2(hours12) + ":" + minutes + " " + suffix;
}




function openModal(mode, appointment, prefillDate) {
  var overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    return;
  }

  document.getElementById("formErrorMsg").textContent = "";

  if (mode === "edit" && appointment) {
    document.getElementById("appointmentId").value = appointment.id;
    document.getElementById("patientName").value = appointment.patientName;
    document.getElementById("doctorName").value = appointment.doctorName;
    document.getElementById("hospitalName").value = appointment.hospitalName;
    document.getElementById("specialty").value = appointment.specialty;
    document.getElementById("appointmentDate").value = appointment.date;
    document.getElementById("appointmentTime").value = appointment.time;
    document.getElementById("reason").value = appointment.reason;
  } else {
    document.getElementById("appointmentForm").reset();
    document.getElementById("appointmentId").value = "";
    if (prefillDate) {
      document.getElementById("appointmentDate").value = prefillDate;
    }
  }

  overlay.classList.add("modal-open");
}

function closeModal() {
  var overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    return;
  }
  overlay.classList.remove("modal-open");
  document.getElementById("appointmentForm").reset();
  document.getElementById("formErrorMsg").textContent = "";
}

function handleAppointmentFormSubmit(event) {
  event.preventDefault();

  var id = document.getElementById("appointmentId").value;
  var patientName = document.getElementById("patientName").value.trim();
  var doctorName = document.getElementById("doctorName").value.trim();
  var hospitalName = document.getElementById("hospitalName").value.trim();
  var specialty = document.getElementById("specialty").value.trim();
  var date = document.getElementById("appointmentDate").value;
  var time = document.getElementById("appointmentTime").value;
  var reason = document.getElementById("reason").value.trim();

  /* ---- basic validation of mandatory fields ---- */
  if (!patientName || !doctorName || !date || !time) {
    document.getElementById("formErrorMsg").textContent =
      "Please fill in Patient Name, Doctor Name, Date and Time.";
    return;
  }

  var list = getAppointments();

  if (id) {
    /* editing an existing appointment */
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].patientName = patientName;
        list[i].doctorName = doctorName;
        list[i].hospitalName = hospitalName;
        list[i].specialty = specialty;
        list[i].date = date;
        list[i].time = time;
        list[i].reason = reason;
        break;
      }
    }
  } else {
    /* creating a new appointment */
    list.push({
      id: generateId(),
      patientName: patientName,
      doctorName: doctorName,
      hospitalName: hospitalName,
      specialty: specialty,
      date: date,
      time: time,
      reason: reason
    });
  }

  saveAppointments(list);
  closeModal();

  /* refresh whichever view is currently on screen */
  if (document.getElementById("calendarGrid")) {
    renderCalendar(currentCalendarDate);
  }
  if (document.getElementById("appointmentTableBody")) {
    applyDashboardFilters();
  }
}

function deleteAppointment(id) {
  var confirmed = confirm("Are you sure you want to delete this appointment?");
  if (!confirmed) {
    return;
  }

  var list = getAppointments();
  var updatedList = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id !== id) {
      updatedList.push(list[i]);
    }
  }
  saveAppointments(updatedList);

  if (document.getElementById("calendarGrid")) {
    renderCalendar(currentCalendarDate);
  }
  if (document.getElementById("appointmentTableBody")) {
    applyDashboardFilters();
  }
}


// calendr page

function renderCalendar(baseDate) {
  var grid = document.getElementById("calendarGrid");
  if (!grid) {
    return;
  }

  var year = baseDate.getFullYear();
  var month = baseDate.getMonth();

  
  document.getElementById("currentDateText").textContent =
    MONTH_NAMES[month] + " " + baseDate.getDate() + ", " + year;

  grid.innerHTML = "";

  var firstDayOfMonth = new Date(year, month, 1);
  var startWeekday = firstDayOfMonth.getDay(); /* 0 = Sunday */
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var daysInPrevMonth = new Date(year, month, 0).getDate();

  var totalCells = 42; 
  var appointments = getAppointments();

  for (var cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    var cellDate; /* the actual Date object for this cell */
    var isOtherMonth = false;

    if (cellIndex < startWeekday) {
      /* leading days from the previous month */
      var prevDay = daysInPrevMonth - startWeekday + cellIndex + 1;
      cellDate = new Date(year, month - 1, prevDay);
      isOtherMonth = true;
    } else if (cellIndex >= startWeekday + daysInMonth) {
      /* trailing days from the next month */
      var nextDay = cellIndex - (startWeekday + daysInMonth) + 1;
      cellDate = new Date(year, month + 1, nextDay);
      isOtherMonth = true;
    } else {
      /* a real day in the current month */
      var dayNum = cellIndex - startWeekday + 1;
      cellDate = new Date(year, month, dayNum);
    }

    var cellDateString = toDateInputValue(cellDate);

    var cell = document.createElement("div");
    cell.className = "calendar-cell" + (isOtherMonth ? " other-month" : "");

    var dayNumberEl = document.createElement("div");
    dayNumberEl.className = "day-number";
    dayNumberEl.textContent = cellDate.getDate();
    cell.appendChild(dayNumberEl);

    cell.addEventListener("click", function () {
      openModal("add", null, this.getAttribute("data-date"));
    });
    cell.setAttribute("data-date", cellDateString);

    /* find and render appointments that fall on this date */
    for (var a = 0; a < appointments.length; a++) {
      if (appointments[a].date === cellDateString) {
        cell.appendChild(buildAppointmentEntry(appointments[a]));
      }
    }

    grid.appendChild(cell);
  }
}

function buildAppointmentEntry(appointment) {
  var entry = document.createElement("div");
  entry.className = "appt-entry";

  var text = document.createElement("span");
  text.className = "appt-text";
  text.textContent =
    appointment.patientName + " - " + appointment.reason +
    " (" + formatTimeNice(appointment.time) + ")";
  entry.appendChild(text);

  var actions = document.createElement("div");
  actions.className = "appt-actions";

  var editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.innerHTML = "&#9998;"; 
  editBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    openModal("edit", appointment);
  });

  var deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn";
  deleteBtn.type = "button";
  deleteBtn.innerHTML = "&#128465;"; 
  deleteBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    deleteAppointment(appointment.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  entry.appendChild(actions);

  /* clicking the box itself (not the buttons) also opens edit */
  entry.addEventListener("click", function (event) {
    event.stopPropagation();
    openModal("edit", appointment);
  });

  return entry;
}


// dashboard page

function applyDashboardFilters() {
  var tableBody = document.getElementById("appointmentTableBody");
  if (!tableBody) {
    return;
  }

  var patientQuery = document.getElementById("patientSearch").value.trim().toLowerCase();
  var doctorQuery = document.getElementById("doctorSearch").value.trim().toLowerCase();
  var startDate = document.getElementById("startDate").value;
  var endDate = document.getElementById("endDate").value;

  var list = getAppointments();
  var filtered = [];

  for (var i = 0; i < list.length; i++) {
    var apt = list[i];

    var matchesPatient = apt.patientName.toLowerCase().indexOf(patientQuery) !== -1;
    var matchesDoctor = apt.doctorName.toLowerCase().indexOf(doctorQuery) !== -1;

    var matchesDateRange = true;
    if (startDate && apt.date < startDate) {
      matchesDateRange = false;
    }
    if (endDate && apt.date > endDate) {
      matchesDateRange = false;
    }

    if (matchesPatient && matchesDoctor && matchesDateRange) {
      filtered.push(apt);
    }
  }

  renderDashboardTable(filtered);
}

function renderDashboardTable(list) {
  var tableBody = document.getElementById("appointmentTableBody");
  tableBody.innerHTML = "";

  var MIN_ROWS = 8;

  if (list.length === 0) {
    var emptyRow = document.createElement("tr");
    emptyRow.className = "no-results-row";
    emptyRow.innerHTML = "<td colspan='7'>No appointments found.</td>";
    tableBody.appendChild(emptyRow);
    addFillerRows(tableBody, MIN_ROWS - 1);
    return;
  }

  for (var i = 0; i < list.length; i++) {
    var apt = list[i];
    var row = document.createElement("tr");

    row.innerHTML =
      "<td class='link-cell'>" + apt.patientName + "</td>" +
      "<td class='link-cell'>" + apt.doctorName + "</td>" +
      "<td>" + apt.hospitalName + "</td>" +
      "<td>" + apt.specialty + "</td>" +
      "<td>" + formatDateNice(apt.date) + "</td>" +
      "<td class='link-cell'>" + formatTimeNice(apt.time) + "</td>" +
      "<td>" +
        "<button type='button' class='action-btn edit-row-btn'>&#9998;</button>" +
        "<button type='button' class='action-btn delete-row-btn'>&#128465;</button>" +
      "</td>";

    /* attach click handlers using closures so each row keeps its own appointment */
    (function (currentApt, currentRow) {
      currentRow.querySelector(".edit-row-btn").addEventListener("click", function () {
        openModal("edit", currentApt);
      });
      currentRow.querySelector(".delete-row-btn").addEventListener("click", function () {
        deleteAppointment(currentApt.id);
      });
    })(apt, row);

    tableBody.appendChild(row);
  }

  addFillerRows(tableBody, MIN_ROWS - list.length);
}


function addFillerRows(tableBody, count) {
  for (var i = 0; i < count; i++) {
    var fillerRow = document.createElement("tr");
    fillerRow.className = "filler-row";
    fillerRow.innerHTML = "<td colspan='7'>&nbsp;</td>";
    tableBody.appendChild(fillerRow);
  }
}


// page starting

document.addEventListener("DOMContentLoaded", function () {


  var bookBtn = document.getElementById("bookAppointmentBtn");
  if (bookBtn) {
    bookBtn.addEventListener("click", function () {
      openModal("add", null, null);
    });
  }


  var closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  var cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  var overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (event) {
     
      if (event.target === overlay) {
        closeModal();
      }
    });
  }

  var form = document.getElementById("appointmentForm");
  if (form) {
    form.addEventListener("submit", handleAppointmentFormSubmit);
  }

  /* ---- sidebar collapse button ---- */
  var collapseBtn = document.getElementById("collapseBtn");
  if (collapseBtn) {
    collapseBtn.addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("collapsed");
    });
  }

  /* ---- calendar page setup ---- */
  if (document.getElementById("calendarGrid")) {
    renderCalendar(currentCalendarDate);

    document.getElementById("prevMonthBtn").addEventListener("click", function () {
      currentCalendarDate = new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth() - 1,
        1
      );
      renderCalendar(currentCalendarDate);
    });

    document.getElementById("nextMonthBtn").addEventListener("click", function () {
      currentCalendarDate = new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth() + 1,
        1
      );
      renderCalendar(currentCalendarDate);
    });

    document.getElementById("todayBtn").addEventListener("click", function () {
      currentCalendarDate = new Date();
      renderCalendar(currentCalendarDate);
    });

 
  }

  /* ---- dashboard page setup ---- */
  if (document.getElementById("appointmentTableBody")) {
    applyDashboardFilters();

    document.getElementById("patientSearch").addEventListener("input", applyDashboardFilters);
    document.getElementById("doctorSearch").addEventListener("input", applyDashboardFilters);
    document.getElementById("updateFilterBtn").addEventListener("click", applyDashboardFilters);
  }

});