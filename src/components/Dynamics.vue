<script>
import { ref, onMounted, onUpdated, onUnmounted } from 'vue';
import { useNCStore } from "../stores/nc"
import { JSONCodec } from "nats.ws";

import Fragile from '@carbon/icons-vue/es/fragile/16'

export default {
    components: {
        Fragile
    },
    setup() {
        const store = useNCStore();
        const js = new JSONCodec();

        let vel = ref(600.0), acc = ref(1000.0), jerk = ref(1000.0);

        function motionSettings() {
            store.nc.publish('motion.settings', js.encode(
                {
                    "max-velocity": vel.value,
                    "max-acceleration": acc.value,
                    "max-jerk": jerk.value
                }
            ))
        }

        onMounted(async () => {
            console.log('Dynamics is mounted');
        });

        return {
            store, vel, acc, jerk,
            motionSettings
        }
    }
}
</script>

<template>
    <div class="cds--grid cds--grid--condensed">
        <div class="cds--row">
            <h4>
                <Fragile class="icon-alt" />&nbsp;Dynamics
            </h4>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Velocity" max="600" min="10" step="10" :value="vel" :disabled="store.run"
                    @cds-slider-changed="vel = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Acceleration" max="10000" min="100" step="100" .value="acc"
                    :disabled="store.run" @cds-slider-changed="acc = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Jerk" max="90000" min="10" step="100" .value="jerk" :disabled="store.run"
                    @cds-slider-changed="jerk = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
    </div>
</template>