jQuery(document).ready(function () {
    jQuery('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        let target = jQuery(e.target).attr("href"); // Get the target tab ID (e.g., #foodie-restaurant-app)
        let slider = jQuery(target).find('.slider-pro'); // Find the slider inside the active tab content

        if (slider.length) {
            setTimeout(() => {
                slider.sliderPro('update'); // Update the slider inside the active tab
            }, 100);
        }
    });
   
});

jQuery(document).ready(function($) {
    $(".ult_tab_li").on("click", function() {
        // Traverse the parent container and find the associated slider
        $(this).closest(".ult_tabs").find(".slider-pro").each(function() {
            var $slider = $(this); // Store reference to the slider
            // Check if slider ID exists and slider is initialized
            if ($slider.length) {
                setTimeout(() => {
                    $slider.sliderPro('update'); // Update the slider inside the active tab
                }, 100);
            } else {
                console.warn("SliderPro instance not found for:", sliderID); // Debugging missing sliderPro instance
            }
        });
    });
});
