import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { Link } from "react-router-dom";

interface STLData {
  geometry: THREE.BufferGeometry;
  dimensions: { x: number; y: number; z: number };
  volume: number;
}

function calculateVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.attributes.position;
  let volume = 0;
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 3) {
    p1.fromBufferAttribute(position, i);
    p2.fromBufferAttribute(position, i + 1);
    p3.fromBufferAttribute(position, i + 2);
    volume += p1.dot(p2.cross(p3)) / 6;
  }
  return Math.abs(volume);
}

function exportSTL(geometry: THREE.BufferGeometry, scale: number, filename: string) {
  const scaledGeometry = geometry.clone();
  scaledGeometry.scale(scale, scale, scale);
  
  const positions = scaledGeometry.attributes.position.array as Float32Array;
  const triangleCount = positions.length / 9;
  
  // Binary STL format
  const bufferLength = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);
  
  // Header (80 bytes)
  for (let i = 0; i < 80; i++) view.setUint8(i, 0);
  
  // Triangle count
  view.setUint32(80, triangleCount, true);
  
  let offset = 84;
  const normal = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  
  for (let i = 0; i < triangleCount; i++) {
    const idx = i * 9;
    v0.set(positions[idx], positions[idx + 1], positions[idx + 2]);
    v1.set(positions[idx + 3], positions[idx + 4], positions[idx + 5]);
    v2.set(positions[idx + 6], positions[idx + 7], positions[idx + 8]);
    
    // Calculate normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    normal.crossVectors(edge1, edge2).normalize();
    
    // Normal
    view.setFloat32(offset, normal.x, true); offset += 4;
    view.setFloat32(offset, normal.y, true); offset += 4;
    view.setFloat32(offset, normal.z, true); offset += 4;
    
    // Vertices
    view.setFloat32(offset, v0.x, true); offset += 4;
    view.setFloat32(offset, v0.y, true); offset += 4;
    view.setFloat32(offset, v0.z, true); offset += 4;
    view.setFloat32(offset, v1.x, true); offset += 4;
    view.setFloat32(offset, v1.y, true); offset += 4;
    view.setFloat32(offset, v1.z, true); offset += 4;
    view.setFloat32(offset, v2.x, true); offset += 4;
    view.setFloat32(offset, v2.y, true); offset += 4;
    view.setFloat32(offset, v2.z, true); offset += 4;
    
    // Attribute byte count
    view.setUint16(offset, 0, true); offset += 2;
  }
  
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function STLModel({ geometry, wireframe, scale }: { geometry: THREE.BufferGeometry; wireframe: boolean; scale: number }) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const yOffset = -box.min.y * scale;

  return (
    <group 
      position={[-(box.max.x + box.min.x) / 2 * scale, yOffset, -(box.max.z + box.min.z) / 2 * scale]}
      scale={[scale, scale, scale]}
    >
      <mesh geometry={geometry}>
        {wireframe ? (
          <meshBasicMaterial color="hsl(142, 50%, 50%)" wireframe />
        ) : (
          <meshStandardMaterial color="hsl(142, 50%, 45%)" metalness={0.3} roughness={0.6} />
        )}
      </mesh>
    </group>
  );
}

export default function STLViewer() {
  const [stlData, setStlData] = useState<STLData | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [fileName, setFileName] = useState("model");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".stl")) {
      setError("Veuillez sélectionner un fichier STL");
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name.replace(/\.stl$/i, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(event.target?.result as ArrayBuffer);
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const box = geometry.boundingBox!;
        const dimensions = {
          x: box.max.x - box.min.x,
          y: box.max.y - box.min.y,
          z: box.max.z - box.min.z,
        };

        const volume = calculateVolume(geometry);

        setStlData({ geometry, dimensions, volume });
        setScale(1);
        setLoading(false);
      } catch {
        setError("Erreur lors du chargement du fichier STL");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const resetView = () => {
    setStlData(null);
    setWireframe(false);
    setError(null);
    setScale(1);
  };

  const handleExport = () => {
    if (!stlData) return;
    exportSTL(stlData.geometry, scale, `${fileName}_scaled_${Math.round(scale * 100)}pct.stl`);
  };

  const scaledDimensions = stlData ? {
    x: stlData.dimensions.x * scale,
    y: stlData.dimensions.y * scale,
    z: stlData.dimensions.z * scale,
  } : null;

  const scaledVolume = stlData ? stlData.volume * Math.pow(scale, 3) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(160, 30%, 8%)", color: "hsl(160, 20%, 90%)", fontFamily: "system-ui" }}>
      {/* Header */}
      <header style={{ padding: "1rem", borderBottom: "1px solid hsl(142, 30%, 20%)", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ color: "hsl(142, 50%, 50%)", textDecoration: "none" }}>← Retour</Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>🐧 Visualiseur STL NIRD</h1>
      </header>

      <main style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
        {/* Controls */}
        <div style={{ padding: "1rem", background: "hsl(160, 30%, 10%)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <label style={{ cursor: "pointer", padding: "0.5rem 1rem", background: "hsl(142, 50%, 30%)", borderRadius: "4px" }}>
            📁 Charger STL
            <input type="file" accept=".stl" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>

          {stlData && (
            <>
              <button
                onClick={() => setWireframe(!wireframe)}
                style={{ padding: "0.5rem 1rem", background: wireframe ? "hsl(142, 50%, 40%)" : "hsl(160, 30%, 20%)", border: "1px solid hsl(142, 30%, 30%)", borderRadius: "4px", cursor: "pointer", color: "inherit" }}
              >
                {wireframe ? "◼ Solide" : "◻ Fil de fer"}
              </button>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📏 Échelle:</span>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  style={{ width: "100px" }}
                />
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  style={{ width: "60px", padding: "0.25rem", background: "hsl(160, 30%, 15%)", border: "1px solid hsl(142, 30%, 30%)", borderRadius: "4px", color: "inherit", textAlign: "center" }}
                />
                <span style={{ color: "hsl(142, 50%, 60%)" }}>({Math.round(scale * 100)}%)</span>
              </div>

              <button
                onClick={handleExport}
                style={{ padding: "0.5rem 1rem", background: "hsl(200, 50%, 35%)", border: "none", borderRadius: "4px", cursor: "pointer", color: "inherit" }}
              >
                💾 Exporter STL
              </button>
              
              <button
                onClick={resetView}
                style={{ padding: "0.5rem 1rem", background: "hsl(0, 50%, 30%)", border: "none", borderRadius: "4px", cursor: "pointer", color: "inherit" }}
              >
                🗑 Réinitialiser
              </button>
            </>
          )}

          {loading && <span>⏳ Chargement...</span>}
          {error && <span style={{ color: "hsl(0, 70%, 60%)" }}>❌ {error}</span>}
        </div>

        {/* Dimensions Panel */}
        {stlData && scaledDimensions && (
          <div style={{ padding: "1rem", background: "hsl(160, 30%, 12%)", borderBottom: "1px solid hsl(142, 30%, 20%)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", fontSize: "0.875rem" }}>
              <div>
                <strong>📐 Dimensions {scale !== 1 ? "(mises à l'échelle)" : ""} (mm)</strong>
                <div style={{ marginTop: "0.25rem", color: "hsl(142, 50%, 60%)" }}>
                  X: {scaledDimensions.x.toFixed(2)} | Y: {scaledDimensions.y.toFixed(2)} | Z: {scaledDimensions.z.toFixed(2)}
                </div>
                {scale !== 1 && (
                  <div style={{ marginTop: "0.25rem", color: "hsl(160, 20%, 50%)", fontSize: "0.75rem" }}>
                    Original: X: {stlData.dimensions.x.toFixed(2)} | Y: {stlData.dimensions.y.toFixed(2)} | Z: {stlData.dimensions.z.toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <strong>📦 Volume {scale !== 1 ? "(mis à l'échelle)" : ""}</strong>
                <div style={{ marginTop: "0.25rem", color: "hsl(142, 50%, 60%)" }}>
                  {scaledVolume.toFixed(2)} mm³ ({(scaledVolume / 1000).toFixed(2)} cm³)
                </div>
                {scale !== 1 && (
                  <div style={{ marginTop: "0.25rem", color: "hsl(160, 20%, 50%)", fontSize: "0.75rem" }}>
                    Original: {stlData.volume.toFixed(2)} mm³
                  </div>
                )}
              </div>
              <div>
                <strong>🔺 Triangles</strong>
                <div style={{ marginTop: "0.25rem", color: "hsl(142, 50%, 60%)" }}>
                  {(stlData.geometry.attributes.position.count / 3).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Viewer */}
        <div style={{ flex: 1, position: "relative" }}>
          {stlData ? (
            <Canvas camera={{ position: [0, 0, Math.max(stlData.dimensions.x, stlData.dimensions.y, stlData.dimensions.z) * 2 * scale], fov: 50 }}>
              <color attach="background" args={["hsl(160, 30%, 6%)"]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.3} />
              <Suspense fallback={null}>
                <STLModel geometry={stlData.geometry} wireframe={wireframe} scale={scale} />
              </Suspense>
              <OrbitControls enableDamping dampingFactor={0.05} />
              <gridHelper args={[100, 20, "hsl(142, 30%, 25%)", "hsl(142, 30%, 15%)"]} />
            </Canvas>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "hsl(160, 20%, 50%)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🐧</div>
              <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Aucun fichier STL chargé</p>
              <p style={{ fontSize: "0.875rem" }}>Cliquez sur "Charger STL" pour commencer</p>
              <p style={{ fontSize: "0.75rem", marginTop: "1rem", maxWidth: "400px", textAlign: "center", opacity: 0.7 }}>
                Rotation: clic gauche + glisser | Zoom: molette | Déplacement: clic droit + glisser
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
