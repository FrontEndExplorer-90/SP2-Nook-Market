// js/ui/alerts.js

export function showFormError(form, message) {
  let alertBox = form.querySelector(".form-error-alert");

  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.className = "form-error-alert alert alert-danger mt-3";
    form.appendChild(alertBox);
  }

  if (!message) {
    alertBox.textContent = "";
    alertBox.style.display = "none";
    return;
  }

  alertBox.style.display = "block";

  if (Array.isArray(message)) {
    alertBox.textContent = message.join(" ");
  } else {
    alertBox.textContent = message;
  }
}
