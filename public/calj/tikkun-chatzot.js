window.delayedSensitiveBlocks = () => {};

window.postSiddur = async (CalJ) => {
    delayedSensitiveBlocks();
    tikkunChatzotSensitiveBlocks();

    function tikkunChatzotSensitiveBlocks() {
        removeIf(CalJ.hasTikkunChatzot, ".show-if-no-tikkun-chatzot", ".show-if-tikkun-chatzot");
        removeIf(CalJ.hasTikkunRachel, ".show-if-no-tikkun-rachel", ".tikkun-rachel");
        $(".donate").addClass(CalJ.language);
    }
};
