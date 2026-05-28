window.prepareSensitiveBlocks = async ({ tachanunHamapil, nightNumber }) => {

    removeIf(!tachanunHamapil, ".tachanun-hamapil");


    const $elt = $(".ana-becoah-repeatable passuk").eq(nightNumber);

    $(".ana-becoah-repeating").append($elt.clone()).append($elt.clone()).append($elt.clone());
    $(".ana-becoah-repeating hint").remove();
};
