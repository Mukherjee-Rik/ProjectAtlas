'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 32;

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0x0a101d, 1.5);
    scene.add(ambientLight);

    const mintLight = new THREE.PointLight(0x2afeb7, 4, 60);
    mintLight.position.set(12, 10, 15);
    scene.add(mintLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3.5, 60);
    purpleLight.position.set(-14, -8, 12);
    scene.add(purpleLight);

    const blueLight = new THREE.PointLight(0x38bdf8, 2.5, 50);
    blueLight.position.set(0, 16, -5);
    scene.add(blueLight);

    // Group for mouse parallax tilt
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Holographic Core (Atlas Restaurant Core)
    const coreGroup = new THREE.Group();
    mainGroup.add(coreGroup);

    // Inner Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x2afeb7,
      emissiveIntensity: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(icoMesh);

    // Inner solid core sphere
    const sphereGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x2afeb7,
      emissive: 0x2afeb7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    coreGroup.add(sphereMesh);

    // Orbiting Ring 1 (Mint)
    const ring1Geo = new THREE.TorusGeometry(5.8, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x2afeb7,
      emissive: 0x2afeb7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    // Orbiting Ring 2 (Purple)
    const ring2Geo = new THREE.TorusGeometry(7.2, 0.06, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.6,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    coreGroup.add(ring2);

    // 2. Floating Satellite 3D Nodes (Restaurant modules: QR, KDS, POS, Floor, Ledger)
    const satelliteCount = 5;
    const satellites: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; height: number }[] = [];
    const colors = [0x2afeb7, 0xa855f7, 0x38bdf8, 0x22c55e, 0xf59e0b];

    for (let i = 0; i < satelliteCount; i++) {
      const satGeo = new THREE.OctahedronGeometry(0.7 + (i % 2) * 0.3, 0);
      const satMat = new THREE.MeshStandardMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.8,
        wireframe: i % 2 === 0,
        roughness: 0.3,
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      const radius = 9 + i * 1.8;
      const angle = (i * 2 * Math.PI) / satelliteCount;
      const height = (i - 2) * 2.2;

      satMesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      mainGroup.add(satMesh);

      satellites.push({
        mesh: satMesh,
        angle,
        speed: 0.008 + (i % 3) * 0.004,
        radius,
        height,
      });
    }

    // 3. Ambient Particle Constellation
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const r = Math.random();
      if (r < 0.45) {
        particleColors[i * 3] = 0.16;
        particleColors[i * 3 + 1] = 0.99;
        particleColors[i * 3 + 2] = 0.71;
      } else if (r < 0.8) {
        particleColors[i * 3] = 0.65;
        particleColors[i * 3 + 1] = 0.33;
        particleColors[i * 3 + 2] = 0.96;
      } else {
        particleColors[i * 3] = 0.22;
        particleColors[i * 3 + 1] = 0.74;
        particleColors[i * 3 + 2] = 0.97;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // Mouse Interaction
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.0006;
      mouseY = (e.clientY - windowHalfY) * 0.0006;
      targetRotationY = mouseX * 1.5;
      targetRotationX = mouseY * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera/group tilt
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

      // Rotate core elements
      coreGroup.rotation.y = elapsedTime * 0.25;
      coreGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.1;
      icoMesh.rotation.x = elapsedTime * 0.3;
      icoMesh.rotation.y = elapsedTime * 0.4;
      ring1.rotation.z = elapsedTime * 0.5;
      ring2.rotation.z = -elapsedTime * 0.4;

      // Orbit satellites
      satellites.forEach((sat, idx) => {
        sat.angle += sat.speed;
        sat.mesh.position.x = Math.cos(sat.angle) * sat.radius;
        sat.mesh.position.z = Math.sin(sat.angle) * sat.radius;
        sat.mesh.position.y = sat.height + Math.sin(elapsedTime * 2 + idx) * 0.6;
        sat.mesh.rotation.x += 0.02;
        sat.mesh.rotation.y += 0.03;
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05;

      // Dynamic light pulsation
      mintLight.intensity = 3.5 + Math.sin(elapsedTime * 2) * 1.2;
      purpleLight.intensity = 3.0 + Math.cos(elapsedTime * 1.8) * 1.0;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-90"
      aria-hidden="true"
    />
  );
}
