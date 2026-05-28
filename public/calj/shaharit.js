/*
 *   This file must be included in the HTML *before* the execution
 *   of siddur.js, because it provides a hook for articulating the
 *   date-aware parts of the tefila proper to Shaharit. 
 */

function prepareSensitiveBlocks(context) {
    $("only-if:not(.kept)").addClass("removed");

    if (context.hallel) keep(".hallel");
    if (context.hallelFull) keep(".hallel-full");
    if (context.torah) keep("only-if.sefer-torah");
    if (context.teshuva10) keep("only-if.teshuva10");
    if (context.gedalya) keep("only-if.gedalya");
    if (context.tevet10) keep("only-if.tevet10");
    if (context.tamuz10) keep("only-if.tamuz17");
    if (context.esther) keep("only-if.esther");
    if (context.purim) keep("only-if.purim");
    if (context.dayAfterKipour) keep("only-if.day-after-kipour");
    if (context.hoshaanaRabba) keep("only-if.hoshaana-rabba");

    keep(`only-if.dow${context.dow}`);

    if (context.chodesh) {
        keep(".chodesh");
        remove(".not-chodesh");  
    } else {
        remove(".chodesh");
        keep(".not-chodesh");
    }
    if (!context.seferSheni) remove(".sefer-sheni");
    if (context.chanuka) { remove(".not-chanuka"); keep(".chanuka"); }

    removeIf(true, ".removed");

    function populateTorah(torah, $sefer) {
        const { aliyot, parashaName, bookName, chapterHeb } = torah;
        const $parasha = $sefer.find("parasha");
        $sefer.find("parasharef").html(`${bookName ?? ''}`);
        $parasha.attr("data-name", parashaName);
        const $alyaTemplate = $("<alya>");
        for (let i = 0; i < aliyot.length - 1; i++) {
            $parasha.append($alyaTemplate.clone());
        }

        for (let i = 0; i < aliyot.length; i++) {
            $parasha.find("alya").eq(i).html(aliyot[i].map(x => x.t
                .replaceAll("{פ}", "")
                .replaceAll("{ס}", "")
                .replaceAll("&nbsp;", " ")
            ).join(" "));
        }
    }

    if (context.torah) {
        populateTorah(context.torah, $("torah").eq(0));
    }

    if (context.seferSheni) {
        populateTorah(context.seferSheni, $("torah").eq(1));
    }
}
