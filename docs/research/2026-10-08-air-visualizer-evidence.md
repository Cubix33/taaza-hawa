# Evidence for a Delhi air visualizer

Researched 2026-10-08. Primary sources only. This is a recommendation, not an implemented feature.

## Recommended scope

Build a Delhi-focused spatial view of the evidence behind Taaza Hawa: user location, nearest station, station distance, observation time, fresh/stale state, estimated interval, contributing neighbours, and the later verification result. A tilted city map can make this engaging. Its distinctive feature should be that uncertainty and missing evidence remain visible. Use a separate educational breathing illustration if time allows; avoid a claimed personal lung simulation.

## What the model can support

Open-Meteo uses CAMS Global for India: approximately 45 km cells, three-hourly native outputs, updated every 12 hours. An hourly API response does not make the underlying model hourly observations. Its PM2.5 and PM10 variables are concentrations in micrograms per cubic metre near the surface, described as 10 m above ground. Aerosol optical depth is a dimensionless whole-atmosphere quantity. The exposed API does not provide a vertical pollution profile; returned coordinates describe the selected grid cell. **Inference:** a detailed Delhi building map or requests at many nearby coordinates cannot establish street, rooftop, floor, or altitude-specific pollution. Show the coarse model as regional context and label any haze as a visual encoding, not measured smoke geometry. [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)

## Exposure and the breathing visual

EPA distinguishes the mass inhaled at the mouth/nose from what is absorbed, deposited, or biologically effective. An educational calculation may use `PM2.5 concentration (µg/m³) × assumed inhalation rate (m³/min) × duration (min)` to compare scenarios, giving estimated mass entering the mouth/nose. For time-varying concentration, sum or integrate over the activity. This does not yield deposited lung mass, damage, disease probability, or a personal diagnosis. EPA also stresses choosing factors representative of the population and scenario. [EPA inhalation exposure tools](https://www.epa.gov/expobox/exposure-assessment-tools-routes-inhalation)

EPA's Exposure Factors Handbook Chapter 6 provides short-term activity-specific inhalation rates, including means and percentiles. These are population assumptions; selecting “walking” or “running” does not measure that user's breathing. If numeric presets are added, cite the chosen table, age group, units, and mapping of activity to intensity; do not invent fixed multipliers. [EPA handbook Chapter 6, Table 6-2](https://www.epa.gov/sites/default/files/2015-09/documents/efh-chapter06.pdf)

Particle deposition depends on breathing mode and pattern and particle size, shape, and other properties. Exercise increases air volume inhaled; some fine particles remain airborne and are exhaled. **Design implication:** an animation may show faster air intake and a comparative particle stream, explicitly illustrative. It should not show exact retained particle counts, blackening lungs, or percentage lung damage from one AQI value. [EPA particle pollution exposure](https://www.epa.gov/pmcourse/particle-pollution-exposure)

AirNow guidance supports reducing exposure by modifying outdoor activity and using forecasts/current reporting. Its school guide recommends changes in exertion and duration as air quality worsens. These are U.S. AQI materials; do not transplant their numeric bands into CPCB AQI without an appropriate mapping and Indian guidance. Do not promise an hour is “safe” solely because it is the lowest predicted value. [AirNow AQI use](https://www.airnow.gov/aqi/aqi-basics/using-air-quality-index/), [school activity guide](https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf)

## What already exists

IQAir Earth already combines a 3D globe, PM2.5 colours/concentration and wind/weather. Consequently, a globe with coloured pollution and animated wind is an established presentation pattern, not our differentiator. [IQAir's own explanation](https://www.iqair.com/support/knowledge-base/what-is-airvisual-earth)

NASA's interactive aerosol globe uses GEOS modelling and observation assimilation, showing separate aerosol types for a specified historical period. NASA Eyes on the Earth also offers immersive 3D Earth data exploration. These demonstrate visual techniques; their modelled or satellite layers are not direct measurements of air entering an individual's lungs. [NASA aerosol globe](https://svs.gsfc.nasa.gov/5552/), [NASA Eyes on the Earth](https://eyes.nasa.gov/apps/earth/)

## Repository-specific feasibility

The station-list service already returns station latitude/longitude; the frontend already finds the nearest station from browser geolocation. Those are enough to start the station map. See `backend/src/taaza/service.py` and `web/src/main.js`.

The current CAMS parser converts raw PM concentrations into CPCB sub-indices and returns sub-indices; the demo likewise generates sub-indices. See `backend/src/taaza/sources/openmeteo.py` and `backend/src/taaza/demo.py`. **Therefore, an exposure-mass display requires retaining a separate, unit-tagged concentration field and its model provenance.** Existing AQI/sub-index fields must never be multiplied by breathing volume. The regional concentration should not be presented as a measurement at the user's pin.

Ship map + evidence trail first. Add activity comparison only after concentration provenance and preset assumptions are explicit. A global earth engine, full fluid simulation, personalised deposition model, and roadside routing are unnecessary for this add-on.
