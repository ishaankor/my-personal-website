console.log("MOBILE FOUND!");

window.onload = function () {
    console.log("WINDOW LOADED!");
    const test = document.getElementById("my-name span");
    test.style.fontSize = "1px";



    const scrollDown = document.getElementById("scroll-down");
    const scrollUp = document.getElementById("scroll-up");
    const scrollDownText = document.getElementById("scroll-down-text");
    const scrollUpText = document.getElementById("scroll-up-text");
    const sections = document.querySelectorAll("section");

    if (sections.length === 0) {
        console.error("No sections found!");
        return;
    }

    let currentIndex = 0;
    let isScrolling = false;

    sections[0].classList.add("active");
    console.log("Sections initialized:", sections);

    function adjustSectionPositioning() {
        const viewportHeight = window.innerHeight;
        sections.forEach((section) => {
            const offsetTop = Math.max(viewportHeight * 0.1, 50);
            section.style.top = `${offsetTop}px`;
        });
    }

    function setInitialScrollText() {
        if (scrollDownText && scrollUpText) {
            scrollDownText.innerHTML = "Swipe Down";
            scrollUpText.innerHTML = "Swipe Up";
        }
    }

    setInitialScrollText();
    adjustSectionPositioning();

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
        console.log("Current section index:", currentIndex);
        console.log("Active section:", document.querySelector("section.active"));
        document.body.style.display = "none";
        document.body.offsetHeight;
        document.body.style.display = "block";
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

    let touchStartY = 0;
    let touchEndY = 0;
    const swipeThreshold = 50;

    function handleTouchStart(event) {
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
        touchEndY = event.touches[0].clientY;
    }

    function handleTouchEnd() {
        if (isScrolling) return;
        const swipeDistance = touchStartY - touchEndY;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0 && currentIndex < sections.length - 1) {
                currentIndex++;
            } else if (swipeDistance < 0 && currentIndex > 0) {
                currentIndex--;
            }
            updateSections(currentIndex);
        }

        isScrolling = true;
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }

    // function isTouchOnlyDevice() {
    //     return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    // }

    // document.addEventListener("touchstart", function (event) {
    //     if (event.touches.length > 1) {
    //         event.preventDefault();
    //     }
    // }, { passive: false });

    // document.addEventListener("wheel", function (event) {
    //     if (isTouchOnlyDevice() && event.ctrlKey) {
    //         event.preventDefault();
    //     }
    // }, { passive: false });

    document.addEventListener("wheel", scrollHandler);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    updateSections(currentIndex);
    checkScrollIndicators();

    window.addEventListener("orientationchange", function () {
        setTimeout(adjustSectionPositioning, 300);
    });

    const projects = document.querySelectorAll(".project");
    let projectIndex = 0;

    function updateProjects() {
        projects.forEach((project, index) => {
            project.classList.remove("active", "prev", "next");
            if (index === projectIndex) {
                project.classList.add("active");
            } else if (index === (projectIndex + 1) % projects.length) {
                project.classList.add("next");
            } else if (index === (projectIndex - 1 + projects.length) % projects.length) {
                project.classList.add("prev");
            } else {
                project.style.opacity = "0";
            }
        });
    }

    function nextProject() {
        projectIndex = (projectIndex + 1) % projects.length;
        updateProjects();
    }

    function prevProject() {
        projectIndex = (projectIndex - 1 + projects.length) % projects.length;
        updateProjects();
    }

    let touchStartX = 0, touchEndX = 0;

    function handleProjectTouchStart(e) {
        touchStartX = e.changedTouches[0].clientX;
    }

    function handleProjectTouchEnd(e) {
        touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) {
            nextProject();
        } else if (touchEndX - touchStartX > 50) {
            prevProject();
        }
    }

    const projectContainer = document.querySelector(".projects-container");
    if (projectContainer) {
        projectContainer.addEventListener("touchstart", handleProjectTouchStart);
        projectContainer.addEventListener("touchend", handleProjectTouchEnd);
    } else {
        console.error("Project container not found!");
    }

    updateProjects();
    window.addEventListener("resize", updateProjects);
};
