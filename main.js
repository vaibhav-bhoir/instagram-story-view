// spotlight story swiper starts
const storySwipers = [],
    autoplayDelay = $('.spotlight-container').data('story-autoplay-delay') || 5000;
const spotlightSliderElement = document.querySelector('.spotlight-slider');
const spotlightContainerElement = document.querySelector('.spotlight-container');
const spotlightContainerPopupElement = document.querySelector('.popup');
let storyTransitionTimeout;
let timeOut = 0;
let i = 0;

// Calculate the height of story details
let currentStoryDetailsHeight = '0px';

// Call this function to update the height of navigation arrows in mobile excluding height of story details
function calculateStoryDetailsHeight(swiper) {
    const activeNestedSwiper = storySwipers[swiper.realIndex];

    if (activeNestedSwiper) {
        const activeNestedSlide = activeNestedSwiper.slides[activeNestedSwiper.realIndex];
        const height = `${jQuery(activeNestedSlide).find('.story-details').outerHeight()}px`;
        currentStoryDetailsHeight = height;
        spotlightContainerElement.style.setProperty('--story-content-height', currentStoryDetailsHeight);
    }
}

// Initialize the Popup Swiper (spotlightSwiper)
const spotlightSwiper = new Swiper(spotlightContainerElement, {
    loop: false,
    init: false,
    autoplay: false,
    slidesPerView: 1,
    spaceBetween: 32,
    centeredSlides: true,
    navigation: {
        nextEl: '.spotlight-container-next',
        prevEl: '.spotlight-container-prev',
    },
    breakpoints: {
        576: {
            slidesPerView: 1.7,
        },
        768: {
            slidesPerView: 1.7,
        },
        992: {
            slidesPerView: 2,
            spaceBetween: 50,
        },
        1200: {
            slidesPerView: 3,
            spaceBetween: 50,
        },
    },
})
    .on('afterInit', function (swiper) {
        // Initialize nested Swipers (storySwipers) after the main Swiper is initialized
        initializeSpotlightStories(spotlightContainerElement);
        storySwipers[swiper.realIndex]?.el?.classList.add('spotlight-slide-visited');
    })
    .on('slideChange', function (swiper) {
        if (!storySwipers[swiper.realIndex]) return;

        // Start and resume autoplay for the current nested Swiper
        storySwipers[swiper.realIndex].autoplay.start();
        storySwipers[swiper.realIndex].autoplay.resume();

        // Mark the current slide as visited
        storySwipers[swiper.realIndex].el.classList.add('spotlight-slide-visited');

        // Clear the previous timeout, if any
        clearStoryTransitionTimeout();

        // Move main slide to the next slide or close popup when there is only one nested story slide
        if (storySwipers[swiper.realIndex].slides.length === 1 && storySwipers[swiper.realIndex].realIndex === 0) {
            storyTransitionTimeout = setTimeout(() => {
                // If there is single story in last slide close the popup after autoplay delay completed
                if (spotlightSwiper.realIndex === spotlightSwiper.slides.length - 1) {
                    // Check if its last slide in story swiper
                    if (swiper.realIndex === swiper.slides.length - 1) {
                        handlePopupClose();
                        storySwipers[swiper.realIndex]?.autoplay?.stop();
                    }
                } else {
                    spotlightSwiper.slideNext();
                }
            }, autoplayDelay);
        }

        changeTransformValue(1);

        // Update swiper arrow Visibility
        updateButtonVisibility(swiper.realIndex);
    })
    .on('beforeSlideChangeStart', function (swiper) {
        const previousSlide = storySwipers[swiper.previousRealIndex ?? swiper.previousIndex];
        if (previousSlide) {
            // Stop autoplay for both previous and current nested Swipers
            previousSlide.autoplay.stop();
        }
        storySwipers[swiper.realIndex]?.autoplay?.stop();
    });

// main parent swiper
new Swiper(spotlightSliderElement, {
    loop: false,
    autoplay: false,
    slidesPerView: 2.5,
    spaceBetween: 16,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    breakpoints: {
        768: {
            slidesPerView: 3,
            spaceBetween: 40,
        },
        992: {
            slidesPerView: 3,
            spaceBetween: 60,
        },
        1200: {
            slidesPerView: 4,
            spaceBetween: 131,
        },
    },
}).on('click', function (swiper) {
    // Initialize the main Swiper
    spotlightContainerPopupElement.classList.add('active');
    document.documentElement.style.overflow = 'hidden';
    if (!spotlightSwiper.initialized) {
        spotlightSwiper.init();
    }

    // Clear the previous timeout, if any
    clearStoryTransitionTimeout();

    spotlightSwiper.slideToLoop(swiper.clickedIndex);
    storySwipers[swiper.clickedIndex]?.autoplay?.start();
    storySwipers[swiper.clickedIndex]?.autoplay?.resume();

    // Move main slide to the next slide or close the popup when there is only one nested story slide
    if (storySwipers[swiper.clickedIndex].slides.length === 1 && storySwipers[swiper.clickedIndex].realIndex === 0) {
        storyTransitionTimeout = setTimeout(() => {
            // If there is single story in last slide close the popup after autoplay delay completed
            if (spotlightSwiper.realIndex === spotlightSwiper.slides.length - 1) {
                // Check if its last slide in story swiper
                if (swiper.realIndex === swiper.slides.length - 1 || storySwipers[swiper.clickedIndex].activeIndex === 0) {
                    handlePopupClose();
                    storySwipers[swiper.realIndex]?.autoplay?.stop();
                }
            } else {
                spotlightSwiper.slideNext();
            }
        }, autoplayDelay);
    }

    // Update swiper arrow Visibility
    updateButtonVisibility(swiper.realIndex);
});

// Function to initialize nested Swipers (storySwipers)
function initializeSpotlightStories(spotlightContainer) {
    [...spotlightContainer.getElementsByClassName('spotlight-slide')].forEach((spotlightSlide, index) => {
        const realSlideIndex = spotlightSlide.getAttribute('data-swiper-slide-index') ?? index;

        // Initialize nested Swiper (storySwiper)
        storySwipers[realSlideIndex] = new Swiper(spotlightSlide.querySelector('.story-container'), {
            loop: true,
            init: false,
            speed: 1,
            autoplay: {
                delay: autoplayDelay,
                disableOnInteraction: false,
                waitForTransition: true,
            },
            slidesPerView: 1,
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        })
            .on('afterInit', function (swiper) {
                // Stop autoplay for all nested Swipers except the first one
                realSlideIndex != 0 && swiper.autoplay.stop();
            })
            .on('slideNextTransitionStart', function (swiper) {
                // Move to the next slide in the main Swiper when the last slide of the nested Swiper is reached
                if (swiper.realIndex === 0) {
                    storySwipers[realSlideIndex]?.autoplay?.stop();
                    if (!spotlightSwiper.loopedSlides && spotlightSwiper.realIndex === spotlightSwiper.slides.length - 1) {
                        handlePopupClose();
                        storySwipers[realSlideIndex]?.autoplay?.stop();
                    } else {
                        spotlightSwiper.slideNext();
                    }
                }
            })
            .on('slidePrevTransitionStart', function (swiper) {
                // Move to the previous slide in the main Swiper when the first slide of the nested Swiper is reached
                if (swiper.realIndex === swiper.slides.length - 1) {
                    spotlightSwiper.slidePrev();
                }
            })
            .on('autoplayTimeLeft', function (_, timeLeft, progress) {
                // Update the story progress using a CSS variable
                spotlightContainerElement.style.setProperty('--story-progress', isNaN(progress) || progress < 0 ? 1 : 1 - progress.toFixed(3));
            })
            .on('slideChange', function (swiper) {
                updateButtonVisibility(realSlideIndex);
            });
        // .on('touchStart', (event) => {
        //     console.log('Touch start');

        //     timeOut = setInterval(function () {
        //         console.log(i++);
        //         storySwipers[realSlideIndex]?.autoplay?.pause();
        //     }, 500);
        // })
        // .on('touchEnd', (event) => {
        //     // Check if autoplay was previously stopped and restart it
        //     console.log('Touch end');
        //     clearInterval(timeOut);
        //     storySwipers[realSlideIndex]?.autoplay?.resume();
        //     console.log(storySwipers[realSlideIndex]?.autoplay);
        //     // storySwipers[realSlideIndex]?.autoplay?.start();
        //     // if (storySwipers[realSlideIndex]?.autoplay?.stop()) {
        //     //     storySwipers[realSlideIndex]?.autoplay?.resume();
        //     // }
        // })
        // .on('autoplayStop', () => {
        //     console.log('Autoplay stop');
        // })
        // .on('autoplayPause', () => {
        //     console.log('Autoplay pause');
        // })
        // .on('autoplayStart', () => {
        //     console.log('Autoplay start');
        // })
        // .on('autoplayResume', () => {
        //     console.log('Autoplay resume');
        // });

        // Initialize the nested Swiper
        storySwipers[realSlideIndex].init();
    });
}

function updateButtonVisibility(index) {
    const isLastSlide = storySwipers[index].isEnd;
    const isFirstSlide = storySwipers[index].isBeginning;

    const nextButton = jQuery(storySwipers[index].el).find('.swiper-button-next');
    const prevButton = jQuery(storySwipers[index].el).find('.swiper-button-prev');

    if (spotlightSwiper.activeIndex === spotlightSwiper.slides.length - 1) {
        isLastSlide ? nextButton.addClass('hidden') : nextButton.removeClass('hidden');
    }

    if (spotlightSwiper.activeIndex === 0) {
        isFirstSlide ? prevButton.addClass('hidden') : prevButton.removeClass('hidden');
    }
}

// Handle popup close
spotlightContainerPopupElement.querySelector('.popup-close-btn').addEventListener('click', function () {
    handlePopupClose();
    storySwipers[spotlightSwiper.realIndex]?.autoplay?.stop();
});

function handlePopupClose() {
    spotlightContainerPopupElement.classList.remove('active');
    document.documentElement.style.overflow = 'visible';
    clearStoryTransitionTimeout();
}

function clearStoryTransitionTimeout() {
    if (storyTransitionTimeout) {
        clearTimeout(storyTransitionTimeout);
    }
}

// Change swiper wrapper transform value to avoid slide stuck issue
function changeTransformValue(offset) {
    const swiperWrapper = spotlightSwiper.slides[spotlightSwiper.realIndex].querySelector('.swiper-wrapper');

    // Get the current transform value
    const currentTransform = swiperWrapper.style.transform || 'translate3d(0px, 0px, 0px)';

    // Extract the X translation value
    const regex = /translate3d\(([-\d.]+)px,/;
    const match = currentTransform.match(regex);

    if (match && match[1] !== undefined) {
        // Calculate the new translation value
        const currentX = parseFloat(match[1]);
        const newX = currentX - offset;

        swiperWrapper.style.transform = `translate3d(${newX}px, 0px, 0px)`;
        setTimeout(() => {
            swiperWrapper.style.transform = `translate3d(${currentX}px, 0px, 0px)`;
        }, 300);
    }
}
// spotlight story swiper ends
