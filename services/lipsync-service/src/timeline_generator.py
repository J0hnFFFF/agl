"""
Timeline generator - Convert visemes to animation timelines
Supports multiple output formats: Unity, Unreal, Web (Three.js)
"""
from typing import List, Dict, Any
from .models import VisemeEvent, UnityLipSyncData, UnrealLipSyncData, WebLipSyncData
import logging

logger = logging.getLogger(__name__)


class TimelineGenerator:
    """Generate animation timelines from visemes"""

    # Standard viseme to blend shape mapping
    # Compatible with ARKit, Oculus, and standard face rigs
    VISEME_TO_BLEND_SHAPE: Dict[str, str] = {
        'sil': 'viseme_sil',
        'PP': 'viseme_PP',
        'FF': 'viseme_FF',
        'TH': 'viseme_TH',
        'DD': 'viseme_DD',
        'kk': 'viseme_kk',
        'CH': 'viseme_CH',
        'SS': 'viseme_SS',
        'nn': 'viseme_nn',
        'RR': 'viseme_RR',
        'aa': 'viseme_aa',
        'E': 'viseme_E',
        'I': 'viseme_I',
        'O': 'viseme_O',
        'U': 'viseme_U',
    }

    def generate_timeline(
        self,
        visemes: List[VisemeEvent],
        output_format: str = "standard"
    ) -> Dict[str, Any]:
        """
        Generate animation timeline

        Args:
            visemes: List of viseme events
            output_format: Output format (standard, unity, unreal, web)

        Returns:
            Timeline data in requested format
        """
        if not visemes:
            return self._empty_timeline(output_format)

        if output_format == "unity":
            return self._generate_unity_timeline(visemes)
        elif output_format == "unreal":
            return self._generate_unreal_timeline(visemes)
        elif output_format == "web":
            return self._generate_web_timeline(visemes)
        else:  # standard
            return self._generate_standard_timeline(visemes)

    def _generate_standard_timeline(
        self,
        visemes: List[VisemeEvent]
    ) -> Dict[str, Any]:
        """
        Generate standard timeline format

        Simple keyframe format that can be adapted to any engine:
        {
          "duration": 3.5,
          "frameRate": 30,
          "keyframes": [
            {"time": 0.0, "viseme": "sil", "weight": 1.0},
            {"time": 0.5, "viseme": "aa", "weight": 1.0},
            ...
          ]
        }
        """
        keyframes = []

        for viseme in visemes:
            # Start keyframe
            keyframes.append({
                'time': viseme.start_time,
                'viseme': viseme.viseme,
                'viseme_name': viseme.viseme_name,
                'blend_shape': self.VISEME_TO_BLEND_SHAPE.get(
                    viseme.viseme,
                    'viseme_sil'
                ),
                'weight': viseme.weight
            })

            # End keyframe (transition to next)
            keyframes.append({
                'time': viseme.end_time,
                'viseme': viseme.viseme,
                'viseme_name': viseme.viseme_name,
                'blend_shape': self.VISEME_TO_BLEND_SHAPE.get(
                    viseme.viseme,
                    'viseme_sil'
                ),
                'weight': 0.0  # Fade out
            })

        duration = max(v.end_time for v in visemes) if visemes else 0.0

        return {
            'format': 'standard',
            'duration': duration,
            'frameRate': 30,
            'keyframes': keyframes,
            'visemeCount': len(visemes)
        }

    def _generate_unity_timeline(
        self,
        visemes: List[VisemeEvent]
    ) -> Dict[str, Any]:
        """
        Generate Unity AnimationClip format

        Unity uses AnimationCurves for blend shapes:
        {
          "clips": [{
            "name": "LipSync",
            "duration": 3.5,
            "curves": [
              {
                "path": "Face",
                "property": "blendShape.viseme_aa",
                "keyframes": [
                  {"time": 0.0, "value": 0.0},
                  {"time": 0.5, "value": 100.0},
                  ...
                ]
              }
            ]
          }]
        }
        """
        # Group keyframes by blend shape
        blend_shape_curves: Dict[str, List[Dict]] = {}

        for viseme in visemes:
            blend_shape = self.VISEME_TO_BLEND_SHAPE.get(viseme.viseme, 'viseme_sil')

            if blend_shape not in blend_shape_curves:
                blend_shape_curves[blend_shape] = []

            # Add keyframes for this viseme
            blend_shape_curves[blend_shape].extend([
                {'time': viseme.start_time, 'value': viseme.weight * 100.0},
                {'time': viseme.end_time, 'value': 0.0}
            ])

        # Build curves
        curves = []
        for blend_shape, keyframes in blend_shape_curves.items():
            # Sort keyframes by time
            keyframes.sort(key=lambda k: k['time'])

            curves.append({
                'path': 'Face',  # Default path to face mesh
                'property': f'blendShape.{blend_shape}',
                'keyframes': keyframes
            })

        duration = max(v.end_time for v in visemes) if visemes else 0.0

        return {
            'format': 'unity',
            'clips': [{
                'name': 'LipSync',
                'duration': duration,
                'frameRate': 30,
                'curves': curves
            }],
            'duration': duration,
            'frameRate': 30
        }

    def _generate_unreal_timeline(
        self,
        visemes: List[VisemeEvent]
    ) -> Dict[str, Any]:
        """
        Generate Unreal Engine Animation Sequence format

        Unreal uses FRichCurve for morph targets:
        {
          "curves": [
            {
              "name": "viseme_aa",
              "keys": [
                {"time": 0.0, "value": 0.0, "interpMode": "linear"},
                {"time": 0.5, "value": 1.0, "interpMode": "linear"},
                ...
              ]
            }
          ]
        }
        """
        # Group keyframes by viseme
        viseme_curves: Dict[str, List[Dict]] = {}

        for viseme in visemes:
            viseme_id = viseme.viseme

            if viseme_id not in viseme_curves:
                viseme_curves[viseme_id] = []

            # Add keyframes
            viseme_curves[viseme_id].extend([
                {
                    'time': viseme.start_time,
                    'value': viseme.weight,
                    'interpMode': 'linear'
                },
                {
                    'time': viseme.end_time,
                    'value': 0.0,
                    'interpMode': 'linear'
                }
            ])

        # Build curves
        curves = []
        for viseme_id, keys in viseme_curves.items():
            # Sort keys by time
            keys.sort(key=lambda k: k['time'])

            blend_shape = self.VISEME_TO_BLEND_SHAPE.get(viseme_id, 'viseme_sil')

            curves.append({
                'name': blend_shape,
                'keys': keys
            })

        duration = max(v.end_time for v in visemes) if visemes else 0.0

        return {
            'format': 'unreal',
            'curves': curves,
            'duration': duration
        }

    def _generate_web_timeline(
        self,
        visemes: List[VisemeEvent]
    ) -> Dict[str, Any]:
        """
        Generate Web-friendly format (Three.js, Babylon.js)

        Uses morph target influences with keyframes:
        {
          "morphTargets": [
            {
              "name": "viseme_aa",
              "keyframes": [
                {"time": 0.0, "value": 0.0},
                {"time": 0.5, "value": 1.0},
                ...
              ]
            }
          ]
        }
        """
        # Group keyframes by viseme
        morph_targets: Dict[str, List[Dict]] = {}

        for viseme in visemes:
            blend_shape = self.VISEME_TO_BLEND_SHAPE.get(viseme.viseme, 'viseme_sil')

            if blend_shape not in morph_targets:
                morph_targets[blend_shape] = []

            # Add keyframes
            morph_targets[blend_shape].extend([
                {'time': viseme.start_time, 'value': viseme.weight},
                {'time': viseme.end_time, 'value': 0.0}
            ])

        # Build morph target array
        morph_target_list = []
        for name, keyframes in morph_targets.items():
            # Sort keyframes by time
            keyframes.sort(key=lambda k: k['time'])

            morph_target_list.append({
                'name': name,
                'keyframes': keyframes
            })

        duration = max(v.end_time for v in visemes) if visemes else 0.0

        return {
            'format': 'web',
            'morphTargets': morph_target_list,
            'duration': duration
        }

    def _empty_timeline(self, output_format: str) -> Dict[str, Any]:
        """Return empty timeline for the specified format"""
        if output_format == "unity":
            return {
                'format': 'unity',
                'clips': [],
                'duration': 0.0,
                'frameRate': 30
            }
        elif output_format == "unreal":
            return {
                'format': 'unreal',
                'curves': [],
                'duration': 0.0
            }
        elif output_format == "web":
            return {
                'format': 'web',
                'morphTargets': [],
                'duration': 0.0
            }
        else:
            return {
                'format': 'standard',
                'duration': 0.0,
                'frameRate': 30,
                'keyframes': []
            }


# Global instance
timeline_generator = TimelineGenerator()
