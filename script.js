
function runComputation(){
	conso=$('#device').val();
	if(conso==-1){
		conso=$('#customDevice-input').val();
	}
	poll=conso*$('#duration').val()/1000*$('#country').val();
	//1g => 3mm^2
	lostSurfaceInmm2=poll*3;
	surf=Math.round(lostSurfaceInmm2*100)/100+' mm&#178';
	if (lostSurfaceInmm2>100) {
		surf=Math.round(lostSurfaceInmm2/100*100)/100+' cm&#178';
	}
	if (lostSurfaceInmm2>100000) {
		surf=Math.round(lostSurfaceInmm2/1000000*100)/100+' m&#178';
	}
	$('#result').html(`<p class="lead"><strong>Due to your usage, `+surf+` of sea ice disappeared in Artic!!!*</strong></p>
	<p class="small mb-0">*Estimation based on the work of <a href="https://science.sciencemag.org/content/354/6313/747">Notz et al., 2016</a>; 
	CO2e/kWh data from <a href="https://www.eia.gov/tools/faqs/faq.php?id=74&t=11"">EIA</a> and 
	<a href="https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-6#tab-googlechartid_googlechartid_googlechartid_googlechartid_chart_11111">EEA</a>.</p>`)
	$('#pinguing').addClass('animate__fadeInUp');
	jQuery('body').css({"background-image": "url('sad-penguin.svg')"});  
}

$(window).on('load', function(){
	$('input').on('change',runComputation);
	$('select').on('change',runComputation);
	$('#device').on('change',function(){
		$('#customDevice').toggle($('#device').val()==-1);
	});
	//runComputation()
});
