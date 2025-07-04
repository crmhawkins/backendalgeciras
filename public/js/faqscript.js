document.addEventListener("DOMContentLoaded", () => {
    const headers = document.querySelectorAll(".accordion-header");
  
    headers.forEach(header => {
      header.addEventListener("click", () => {
        const currentlyOpen = document.querySelector(".accordion-header.active");
  
        if (currentlyOpen && currentlyOpen !== header) {
          currentlyOpen.classList.remove("active");
          currentlyOpen.nextElementSibling.classList.remove("open");
        }
  
        header.classList.toggle("active");
        header.nextElementSibling.classList.toggle("open");
      });
    });
  });
  