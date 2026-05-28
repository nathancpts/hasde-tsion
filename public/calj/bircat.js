window.delayedSensitiveBlocks = () => {};

window.postSiddur = async (CalJ) => {
    $("#divAskRoshChodeshMeal button").click(function () {
      $("#divAskRoshChodeshMeal").remove();
    });
    $("#divAskRoshChodeshMeal button.buttonNo").click(function () {
        delayedSensitiveBlocks();
        bircatSensitiveBlocks();
    });
    $("#divAskRoshChodeshMeal button.buttonYes").click(function () {
        CalJ.yaalei = true;
        CalJ.chodesh = true;
        delayedSensitiveBlocks();
        bircatSensitiveBlocks();
    });

    removeIf(!CalJ.shouldAskChodeshMeal, "#divAskRoshChodeshMeal");
    if (!CalJ.shouldAskChodeshMeal) {
        delayedSensitiveBlocks();
        bircatSensitiveBlocks();
    }

    $(".with-language").addClass(CalJ.language);

    function bircatSensitiveBlocks() {
        removeIf(CalJ.yaalei, ".Magdil", ".Migdol");
        removeIf(CalJ.isIsrael, "show-if-not-israel", "show-if-israel");
        $("#content").removeClass('hidden');
        $(".donate").addClass(CalJ.language);
    }
    //
    // Translate labels
    //
    if (CalJ.translate) {
        $(".translatable").each(function (i, e) {
            var $e = $(e);
            var tkey = $e.data("tkey");
            $e.text(CalJ.translate[tkey]);
        });
	}
};
