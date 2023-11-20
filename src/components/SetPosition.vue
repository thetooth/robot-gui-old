<script>
import { ref, onMounted, onUpdated, onUnmounted } from 'vue';
import { useNCStore } from "../stores/nc"

import DataCollection from '@carbon/icons-vue/es/data-collection/16'

export default {
    components: {
        DataCollection
    },
    setup() {
        const store = useNCStore();

        const x = 0, y = 0;

        onMounted(async () => {
            console.log('SetPosition is mounted');
        });

        return { store, x, y }
    }
}
</script>

<template>
    <div class="cds--grid cds--grid--condensed">
        <div class="cds--row">
            <h4>
                <DataCollection class="icon-alt" />&nbsp;Set Position
            </h4>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="DX" max="400" min="-400" step="1" .value="store.controls.x"
                    @cds-slider-changed="x = $event.detail.value; store.immediate(x, store.controls.y)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="DY" max="400" min="-200" step="1" .value="store.controls.y"
                    @cds-slider-changed="y = $event.detail.value; store.immediate(store.controls.x, y)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
    </div>
</template>