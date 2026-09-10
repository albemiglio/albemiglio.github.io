"""Shared style card for the device family (laptop, phone, and later objects).

One palette, one bevel radius, one place that defines what "premium" means as
numbers, so two scripts rendered independently still read as one family (see
the skill's coherence rule). Colour lives on materials here, never on a light.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import pbr  # noqa: E402

# Albedo is deliberately well below the "silver = almost white" instinct. Under a
# studio HDRI a 0.80 metal blows out to a flat white silhouette with no structure
# left in it — the cheap-render look. Real anodised aluminium sits near 0.55 and
# keeps its gradient, which is what reads as machined metal on a dark page.
BODY = (0.62, 0.62, 0.63)      # satin back covers
ALU = (0.56, 0.57, 0.59)       # anodised aluminium: rails, chassis, hinges
GLASS = (0.05, 0.06, 0.07)     # base colour under transmission: cover glass
INK = (0.06, 0.06, 0.065)      # near-black satin: bezels, keys, ports

BEVEL_R = 0.012

_KINDS = {
    "body": dict(rgb=BODY, roughness=0.38),
    "alu": dict(rgb=ALU, roughness=0.32, metallic=1.0),
    "glass": dict(rgb=GLASS, roughness=0.02, transmission=1.0, ior=1.5),
    "ink": dict(rgb=INK, roughness=0.5),
}


def mat(name, kind):
    """A `common.pbr` material named `name`, built from the `kind` style-card
    preset (one of "body", "alu", "glass", "ink")."""
    return pbr(name, **_KINDS[kind])
