<script>
import { ref, onMounted, onUpdated, onUnmounted } from 'vue';
import { useNCStore } from "../stores/nc"

export default {
    components: {
    },
    setup() {
        const store = useNCStore();

        const x = 0, y = 0, z = 0, r = 0;

        onMounted(async () => {
            console.log('SetPosition is mounted');
        });

        function setHere() {
            store.controls.x = Math.round(store.dro.pose.x * 1e3) / 1e3
            store.controls.y = Math.round(store.dro.pose.y * 1e3) / 1e3
            store.controls.z = Math.round(store.dro.pose.z * 1e3) / 1e3
            store.controls.r = Math.round(store.dro.pose.r * 1e3) / 1e3
        }

        return {
            store, x, y, z, r,
            setHere
        }
    }
}
</script>

<template>
    <div class="cds--grid cds--grid--condensed">
        <div class="cds--row">
            <h4>
                Set Position
            </h4>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="X" max="400" min="-400" step="1" .value="store.controls.x"
                    @cds-slider-changed="x = $event.detail.value; store.immediate(x, store.controls.y, store.controls.z, store.controls.r)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Y" max="400" min="-200" step="1" .value="store.controls.y"
                    @cds-slider-changed="y = $event.detail.value; store.immediate(store.controls.x, y, store.controls.z, store.controls.r)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Z" max="150" min="0" step="1" .value="store.controls.z"
                    @cds-slider-changed="z = $event.detail.value; store.immediate(store.controls.x, store.controls.y, z, store.controls.r)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="R" max="360" min="0" step="1" .value="store.controls.r"
                    @cds-slider-changed="r = $event.detail.value; store.immediate(store.controls.x, store.controls.y, store.controls.z, r)">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-button kind="secondary" size="md" @click="setHere">Place Cursor Here</cds-button>
            </div>
        </div>
    </div>
</template>