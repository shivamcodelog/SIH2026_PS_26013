---
name: leaflet
description: Expert Leaflet and React-Leaflet engineering for the SIH26013 project. Use when implementing, modifying, debugging, or reviewing maps, markers, GeoJSON, spatial visualization, map interactions, layers, clustering, viewport-based loading, and PostGIS-to-frontend geographic data flows.
---

# Leaflet Engineering Skill — SIH26013

## Project Context

This project uses React with JavaScript, React-Leaflet/Leaflet, Node.js/Express, PostgreSQL, and PostGIS.

The geographic data flow is:

PostGIS → Backend → API → GeoJSON → React → React-Leaflet → Leaflet

Leaflet is strictly a frontend visualization and interaction layer. The frontend must NEVER connect directly to PostgreSQL or PostGIS.

This project uses JavaScript, NOT TypeScript. Never introduce `.ts` or `.tsx` files or convert existing JavaScript code to TypeScript.

---

## 1. Coordinate Conventions

Coordinate correctness is critical.

The project's geographic database should use an explicitly documented CRS/SRID. Unless the project architecture specifies otherwise, use WGS84 / EPSG:4326 for geographic coordinates.

GeoJSON coordinates use:

```text
[longitude, latitude]

Example:

{
  "type": "Point",
  "coordinates": [77.2090, 28.6139]
}

Leaflet positions normally use:

[latitude, longitude]

Example:

const position = [28.6139, 77.2090];

Therefore:

GeoJSON/PostGIS representation:
[longitude, latitude]

Leaflet representation:
[latitude, longitude]

Never silently mix these conventions.

Whenever converting between GeoJSON and Leaflet coordinates, make the conversion explicit.

Never reverse coordinates merely to make a map "look correct." Verify the actual coordinate convention first.

When implementing geographic functionality, verify:

coordinate order
CRS/SRID
valid latitude range
valid longitude range
geometry type
expected precision
2. React-Leaflet Architecture

Keep map functionality modular.

Prefer a structure such as:

frontend/src/
├── map/
│   ├── MapView.jsx
│   ├── MapLayers.jsx
│   ├── LocationMarkers.jsx
│   ├── GeoJsonLayer.jsx
│   ├── MapControls.jsx
│   ├── mapUtils.js
│   └── mapConstants.js

Do not put the complete map implementation inside App.jsx.

Create reusable components for reusable map behavior.

Use React-Leaflet components wherever practical:

<MapContainer>
  <TileLayer />
  <Marker />
  <Popup />
</MapContainer>

Do not unnecessarily manipulate Leaflet's DOM directly.

Imperative Leaflet APIs may be used when necessary, but isolate them inside dedicated components or hooks.

3. Map Lifecycle

Map instances and Leaflet objects must have predictable lifecycles.

Avoid:

creating multiple Leaflet map instances for the same container
repeatedly initializing a map
leaking event listeners
repeatedly creating layers without cleanup
manipulating DOM elements controlled by React
leaving timers or subscriptions active after component unmount

When manually registering Leaflet event listeners:

register the listener
use the listener
remove the listener during cleanup

When creating Leaflet objects imperatively, ensure they are properly removed or released when no longer needed.

4. API Contract

The frontend must consume geographic data through the backend API.

Do not make database requests from Leaflet or React.

For geographic collections, prefer standardized GeoJSON:

{
  "type": "FeatureCollection",
  "features": []
}

A geographic feature should follow:

{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [77.2090, 28.6139]
  },
  "properties": {
    "id": "123",
    "name": "Example Location",
    "confidence": 0.96
  }
}

Keep geographic geometry inside geometry.

Keep application metadata inside properties.

Do not create multiple incompatible representations of the same geographic data without a documented reason.

Before changing an API response:

inspect existing consumers
update the API contract
update frontend consumers
update tests
verify the complete data flow
5. PostGIS Integration

The frontend must not know how PostGIS queries are implemented.

PostGIS/backend responsibilities include:

spatial filtering
distance calculations
intersection queries
bounding-box queries
coordinate transformations
geometry validation
GeoJSON generation

The frontend receives normalized geographic data and renders it.

The intended architecture is:

PostGIS
   ↓
Spatial query
   ↓
Backend service
   ↓
GeoJSON
   ↓
API
   ↓
React
   ↓
React-Leaflet
   ↓
Leaflet

If a geographic feature requires changes to PostGIS, inspect the database schema and backend query before modifying the frontend.

6. Spatial Data Loading

Never fetch the entire geographic dataset merely because a map is displayed.

For potentially large datasets, prefer:

viewport-based queries
bounding-box filtering
server-side filtering
spatial indexes
clustering
aggregation
pagination where appropriate
level-of-detail strategies

Preferred flow:

Current map viewport
        ↓
Bounding box
        ↓
Backend API
        ↓
PostGIS spatial query
        ↓
Only required features
        ↓
GeoJSON
        ↓
Leaflet

Map viewport changes should not automatically cause an API request for every tiny movement.

Use debouncing or throttling where appropriate.

7. Markers

Normal markers are acceptable for small datasets.

Do not blindly render thousands of individual React-Leaflet markers.

Before rendering a large number of points, evaluate:

marker clustering
viewport-based loading
server-side filtering
GeoJSON layers
canvas rendering
vector rendering
aggregation

Do not introduce a clustering dependency unless the expected dataset size justifies it.

Do not optimize prematurely, but do not ignore scalability when the project requirements indicate large geographic datasets.

8. GeoJSON

Use GeoJSON consistently for geographic API data.

Support geometry types required by the project, including:

Point
MultiPoint
LineString
MultiLineString
Polygon
MultiPolygon
GeometryCollection

Never assume that every geographic feature is a Point.

When adding a new geometry type:

verify the PostGIS representation
verify the API representation
verify GeoJSON validity
verify Leaflet rendering
add appropriate tests

Do not modify geometry structure without checking all consumers.

9. Markers and Popups

Keep marker and popup components lightweight.

Prefer:

<Marker position={position}>
  <Popup>
    <LocationDetails location={location} />
  </Popup>
</Marker>

Do not put large amounts of business logic inside popup components.

The map should trigger application actions through callbacks or application services.

Avoid putting database logic, authentication logic, or complex entity-resolution logic inside map components.

10. Map State

Separate map state from application/business state.

Map state may include:

center
zoom
bounds
selected feature
active layer
visible layers

Application state may include:

locations
search results
confidence scores
review status
user permissions
selected entity
filters

Do not duplicate the same state unnecessarily.

A selected location should have one authoritative source of truth.

11. Map Interactions

Map interactions should have clear data flows.

Example:

User clicks marker
        ↓
Select location
        ↓
Show location details

Viewport change:

Viewport changes
        ↓
Debounced bounds update
        ↓
API request
        ↓
PostGIS spatial query
        ↓
Updated GeoJSON
        ↓
Map update

Filter change:

User changes filter
        ↓
API query changes
        ↓
Backend filtering
        ↓
Updated results
        ↓
Map updates

Do not put large datasets into frontend state if they can remain server-filtered.

12. Loading, Error, and Empty States

Every map data request must explicitly handle:

loading
success
empty
error

Do not leave the user with a blank map when an API request fails.

Distinguish between:

No geographic results found

and:

Failed to load geographic results

The base map may remain usable when geographic data fails, if technically appropriate.

13. Map Performance

Measure before making complex optimizations.

Watch for:

excessive React renders
unnecessary marker recreation
repeated API calls
huge GeoJSON payloads
excessive DOM nodes
expensive popup rendering
unnecessary state updates
loading data outside the current viewport

Prefer the simplest solution that satisfies the expected dataset size.

Do not introduce advanced rendering libraries or architectures without a demonstrated performance need.

14. Base Map Configuration

Centralize map configuration.

Do not scatter tile URLs, default zoom values, or map configuration throughout components.

Example:

export const MAP_CONFIG = {
  defaultCenter: [28.6139, 77.2090],
  defaultZoom: 10
};

Keep tile provider configuration centralized.

Respect the tile provider's usage policy and attribution requirements.

Never remove required map attribution.

Never place API keys or private credentials directly in frontend source code.

15. Accessibility

The map must not be the only way users can access important geographic information.

Important geographic information should also be accessible through:

result lists
detail panels
tables
accessible controls

Map controls should have meaningful labels.

Do not assume that every user can interact with the map using a mouse.

Keyboard-accessible alternatives should be provided where appropriate.

16. Security

Never trust geographic data received from APIs or external sources.

Validate:

coordinates
geometry
IDs
filters
query parameters

Do not inject untrusted HTML into Leaflet popups.

Prefer React-rendered popup content.

Do not expose:

database credentials
API secrets
private service credentials
internal backend configuration

in frontend code.

17. External Geographic Data

This SIH project may combine geographic data from multiple sources.

Never assume different sources use:

identical naming
identical coordinate formats
identical CRS
identical geometry types
identical precision
identical administrative boundaries
identical IDs

Normalization and entity resolution belong primarily in the backend/data-processing layer.

The map should consume the normalized representation.

Do not implement source-specific normalization hacks inside Leaflet components.

18. Entity Resolution and Confidence

The SIH project may display entity-resolution results and confidence scores.

Example:

Location
Name
Source
Matched entity
Confidence
Review status

The map should visualize the normalized result.

Do not implement matching algorithms inside Leaflet components.

If confidence or review status affects map visualization, keep the visualization logic separate from the matching algorithm.

Example:

Entity resolution
        ↓
Normalized location
        ↓
Confidence
        ↓
API
        ↓
Map visualization
19. Testing

Test important map behavior.

Tests should cover where applicable:

GeoJSON parsing
coordinate conversion
marker rendering
popup rendering
feature selection
filtering
empty results
API failures
viewport queries
geometry rendering
layer visibility

Explicitly test coordinate conversion.

Example:

GeoJSON:
[77.2090, 28.6139]

Leaflet:
[28.6139, 77.2090]

Use known coordinates to detect accidental latitude/longitude inversion.

Geospatial functionality that depends on PostGIS should also be tested at the backend/database level.

20. Cross-Layer Change Rule

Before modifying geographic functionality, inspect the complete chain:

PostGIS schema
      ↓
Spatial query
      ↓
Backend service
      ↓
API response
      ↓
Frontend data handling
      ↓
React component
      ↓
React-Leaflet
      ↓
Leaflet

A change in one layer can break another.

Before changing geographic data structures:

inspect the database representation
inspect backend queries
inspect API response
inspect frontend consumers
inspect map rendering
update relevant tests

Never make isolated changes to a shared geographic contract.

21. Dependency Rules

Before adding a new mapping dependency:

inspect existing dependencies
determine whether existing Leaflet/React-Leaflet functionality is sufficient
determine whether the dependency solves a real requirement
check bundle/performance impact
check compatibility with the existing React version
add the dependency only if justified

Do not add duplicate mapping libraries.

Do not introduce Mapbox, MapLibre, Google Maps, OpenLayers, or another mapping framework unless the project requirements explicitly require it.

The default mapping stack is:

Leaflet + React-Leaflet
22. AI Agent Rules

Before implementing a Leaflet feature:

Inspect the existing frontend architecture.
Inspect existing map components.
Inspect the API response.
Inspect the PostGIS representation if relevant.
Reuse existing components and utilities.
Preserve coordinate conventions.
Preserve API contracts.
Avoid unnecessary dependencies.
Add or update tests.
Run relevant tests.
Run the frontend build.
Verify that existing functionality still works.

Never:

introduce TypeScript
create .ts or .tsx files
connect Leaflet directly to PostgreSQL/PostGIS
reverse coordinates without verifying the coordinate convention
silently change SRIDs
fetch the entire database for map rendering
render thousands of markers without evaluating performance
duplicate application state unnecessarily
remove map attribution
expose secrets
put business/data-processing logic into map components
rewrite working map architecture unnecessarily
23. Definition of Done

A Leaflet feature is complete only when:

 Coordinate order is verified
 CRS/SRID assumptions are verified
 API contract is respected
 PostGIS integration is correct when applicable
 GeoJSON is valid
 Loading state works
 Error state works
 Empty state works
 Map interaction works
 Expected dataset size has been considered
 Performance is reasonable
 Accessibility has been considered
 Tests pass
 Existing functionality still works
 Frontend builds successfully
 No unnecessary dependencies were introduced
 No TypeScript was introduced
 No secrets were exposed