// Slick Carousal Slider
jQuery(document).on('ready', function() {
  jQuery(".tdt-slider").each(function(index, el) {
    var mobiles    = jQuery(this).data('mobiles');
    var tabs    = jQuery(this).data('tabs');
    jQuery(this).slick({
    dots: true,
    infinite: true,
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: tabs,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: mobiles,
          slidesToScroll: 1
        }
      }
      ]
  }); 
  });
});

jQuery(document).on('ready', function() {
  jQuery(".post-slider").each(function(index, el) {
    var mobile    = jQuery(this).data('mobile');
    var tab    = jQuery(this).data('tab');
    jQuery(this).slick({
      dots: true,
      infinite: true,
      slidesToShow: 1,
      autoplay: true,
      autoplaySpeed: 2000,
      responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: tab,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: mobile,
          slidesToScroll: 1
        }
      }
      ]
    });
  });
});

jQuery(document).ready(function() {
  setTimeout(function() {
    jQuery('.tdt-slider.slick-slider .slick-next, .post-slider.slick-slider .slick-next').addClass('fas fa-chevron-right');  
    jQuery('.tdt-slider.slick-slider .slick-prev, .post-slider.slick-slider .slick-prev').addClass('fas fa-chevron-left'); 
  }, 300);
});