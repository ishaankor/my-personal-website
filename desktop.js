console.log("DESKTOP FOUND!")

window.onload = function () {
    console.log("?")
    document.body.style.overflow = "hidden";
    setTimeout(() => {
        document.body.classList.add("loaded"); 
        document.body.style.overflow = ""; 
    }, 50); 
    const sections = document.querySelectorAll("section");
    sections[0].classList.add("active"); 
    document.querySelectorAll(".project").forEach(project => {
        project.addEventListener("mousemove", (e) => {
          const bubble = project.querySelector(".thought-bubble");
          const rect = project.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          bubble.style.left = `${offsetX}px`;
        });
    });
    document.querySelectorAll(".project").forEach((project) => {
        const bubble = project.querySelector(".thought-bubble"); 
        const text = bubble.textContent;
        let typingInterval;

        project.addEventListener("mouseenter", () => {
            bubble.style.opacity = "1"; 
            bubble.style.visibility = "visible";
            bubble.textContent = ""; 

            let i = 0;
            typingInterval = setInterval(() => {
                if (i < text.length) {
                    bubble.textContent += text[i]; 
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 50);
        });

        project.addEventListener("mouseleave", () => {
            clearInterval(typingInterval); 
            bubble.style.opacity = "0";
            bubble.style.visibility = "hidden";
        });
    });
    document.querySelectorAll(".project").forEach((project) => {
        const light = project.querySelector(".light"); 
        let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
        let isHovering = false;
        function moveLight() {
            if (!isHovering) return; 
            mouseX += (targetX - mouseX) * 0.5;
            mouseY += (targetY - mouseY) * 0.5;
            light.style.left = `${mouseX}px`; 
            light.style.top = `${mouseY}px`;
            requestAnimationFrame(moveLight);
        }
        project.addEventListener("mouseenter", () => {
            if (!isHovering) {
                light.style.opacity = "1";
                isHovering = true;
                moveLight();
            }
        });
        project.addEventListener("mousemove", (e) => {
            const rect = project.getBoundingClientRect();
            targetX = e.clientX - rect.left;
            targetY = e.clientY - rect.top;
        });
        project.addEventListener("mouseleave", () => {
            light.style.opacity = "0";
            isHovering = false;
        });
    });
    document.querySelectorAll(".project").forEach((project) => {
        let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
        let isHovering = false;

        function updateTilt() {
            if (!isHovering) return; 

            mouseX += (targetX - mouseX) * 0.75;
            mouseY += (targetY - mouseY) * 0.75;

            const rect = project.getBoundingClientRect();
            const x = (mouseX - rect.left) / rect.width - 0.5; 
            const y = (mouseY - rect.top) / rect.height - 0.5;

            const tiltX = y * 70;
            const tiltY = x * -70;

            project.style.transform = `perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.1)`;
            project.style.boxShadow = `${-tiltY * 1.5}px ${tiltX * 1.5}px 30px rgba(0, 0, 0, 0.4)`;

            requestAnimationFrame(updateTilt);
        }

        project.addEventListener("mouseenter", () => {
            isHovering = true;
            updateTilt();
        });

        project.addEventListener("mousemove", (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        project.addEventListener("mouseleave", () => {
            isHovering = false;
            project.style.transform = "perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)";
            project.style.boxShadow = "none";
        });
    });
    document.querySelectorAll(".project").forEach((project) => {
        const bubble = project.querySelector(".thought-bubble");
        const text = bubble.getAttribute("data-text") || bubble.textContent.trim(); 
        let typingInterval;

        project.addEventListener("mouseenter", () => {
            bubble.style.opacity = "1";
            bubble.style.visibility = "visible";
            bubble.textContent = ""; 
            bubble.style.top = "106%";
            bubble.style.bottom = "auto";

            let i = 0;
            typingInterval = setInterval(() => {
                if (i < text.length) {
                    bubble.textContent += text[i];
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 50);

            bubble.style.width = `${project.clientWidth}px`;
        });

        project.addEventListener("mouseleave", () => {
            clearInterval(typingInterval);
            bubble.style.opacity = "0";
            bubble.style.visibility = "hidden";
        });
    });
    const scrollDown = document.getElementById("scroll-down");
    const scrollUp = document.getElementById("scroll-up");
    const scrollDownText = document.getElementById("scroll-down-text");
    const scrollUpText = document.getElementById("scroll-up-text");
    let currentIndex = 0;
    let isScrolling = false;

      // function hasCursor() {
      //     return window.matchMedia("(pointer: fine)").matches && navigator.maxTouchPoints === 0;
      // }

      // function isTouchOnlyDevice() {
      //     return 'ontouchstart' in window && navigator.maxTouchPoints > 0 && !hasCursor();
      // }

    function adjustSectionPositioning() {
        const viewportHeight = window.innerHeight;
        sections.forEach((section) => {
            const offsetTop = Math.max(viewportHeight * 0.1, 50); 
            section.style.top = `${offsetTop}px`;
        });
    }

    function setInitialScrollText() {
        scrollDownText.innerHTML = "Scroll Down";
        scrollUpText.innerHTML = "Scroll Up";
    }

      setInitialScrollText();
      adjustSectionPositioning();

      document.addEventListener("DOMContentLoaded", setInitialScrollText);
      //   window.matchMedia("(pointer: fine)").addEventListener("change", setInitialScrollText);

      function updateSections(index) {
        sections.forEach((section, i) => {
            section.classList.remove("active", "prev", "next");

            if (i === index) {
                section.classList.add("active");
            } else if (i < index) {
                section.classList.add("prev");
            } else {
                section.classList.add("next");
            }
        });
        setTimeout(checkScrollIndicators, 500);
      }

      function checkScrollIndicators() {
          if (currentIndex === 0) {
              scrollDown.classList.add("visible");
              scrollUp.classList.remove("visible");
          } else if (currentIndex === sections.length - 1) {
              scrollDown.classList.remove("visible");
              scrollUp.classList.add("visible");
          } else {
              scrollDown.classList.remove("visible");
              scrollUp.classList.remove("visible");
          }
      }

      function scrollHandler(event) {
          if (isScrolling) return;
          isScrolling = true;

          if (event.deltaY > 0 && currentIndex < sections.length - 1) {
              currentIndex++;
          } else if (event.deltaY < 0 && currentIndex > 0) {
              currentIndex--;
          }

          updateSections(currentIndex);

          setTimeout(() => {
              isScrolling = false;
          }, 1000);
      }

    //   let touchStartY = 0;
    //   let touchEndY = 0;
    //   const swipeThreshold = 50;

    //   function handleTouchStart(event) {
    //       touchStartY = event.touches[0].clientY;
    //   }

    //   function handleTouchMove(event) {
    //       touchEndY = event.touches[0].clientY;
    //   }

    //   function handleTouchEnd() {
    //       if (isScrolling) return;

    //       const swipeDistance = touchStartY - touchEndY;

    //       if (Math.abs(swipeDistance) > swipeThreshold) {
    //           if (swipeDistance > 0 && currentIndex < sections.length - 1) {
    //               currentIndex++;
    //           } else if (swipeDistance < 0 && currentIndex > 0) {
    //               currentIndex--;
    //           }
    //           updateSections(currentIndex);
    //       }

    //       isScrolling = true;
    //       setTimeout(() => {
    //           isScrolling = false;
    //       }, 1000);
    //   }

    //   document.addEventListener("touchstart", function(event) {
    //       if (event.touches.length > 1) {
    //           event.preventDefault();
    //       }
    //   }, { passive: false });

    //   document.addEventListener("wheel", function(event) {
    //       if (isTouchOnlyDevice() && event.ctrlKey) {
    //           event.preventDefault();
    //       }
    //   }, { passive: false });

      document.addEventListener("wheel", scrollHandler);
    //   document.addEventListener("touchstart", handleTouchStart);
    //   document.addEventListener("touchmove", handleTouchMove);
    //   document.addEventListener("touchend", handleTouchEnd);

      updateSections(currentIndex);
      checkScrollIndicators();

    //   window.addEventListener("orientationchange", function () {
    //   setTimeout(adjustSectionPositioning, 300);
    //     });
};