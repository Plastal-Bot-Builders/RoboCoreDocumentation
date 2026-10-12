"""Camera helpers for screenshots (robot frame, mm)."""
import adsk.core
import rc_lib as L

VIEWS = {
    'iso': ((260, -320, 260), (0, -5, 30)),
    'iso_front': ((260, 330, 220), (0, 0, 30)),
    'iso_rear': ((-240, -330, 240), (0, -5, 30)),
    'top': ((0, -5, 600), (0, -5, 30)),
    'bottom': ((0, -5, -600), (0, -5, 30)),
    'side': ((600, -5, 32), (0, -5, 32)),
    'front': ((0, 600, 32), (0, 0, 32)),
    'rear': ((0, -600, 32), (0, 0, 32)),
    'under_iso': ((240, -260, -220), (0, -5, 20)),
    'hero': ((215, 330, 150), (0, -2, 30)),
}


def set_view(name, fit=True, ortho=False, extent=None):
    eye, tgt = VIEWS[name]
    vp = L.app.activeViewport
    cam = vp.camera
    cam.isSmoothTransition = False
    cam.cameraType = adsk.core.CameraTypes.OrthographicCameraType if ortho else adsk.core.CameraTypes.PerspectiveCameraType
    cam.eye = L.P3(*eye)
    cam.target = L.P3(*tgt)
    up = (0, 1, 0) if name in ('top', 'bottom') else (0, 0, 1)
    cam.upVector = adsk.core.Vector3D.create(*up)
    cam.isFitView = fit
    vp.camera = cam
    if fit:
        vp.fit()
    if extent:
        cam = vp.camera
        cam.viewExtents = L.cm(extent)
        vp.camera = cam
    vp.refresh()
    return 'view ' + name


def visibility(names_on=None, names_off=None):
    root = L.design().rootComponent
    for o in root.occurrences:
        n = o.component.name
        if names_off and any(n.startswith(k) or o.name.startswith(k) for k in names_off):
            o.isLightBulbOn = False
        if names_on and any(n.startswith(k) or o.name.startswith(k) for k in names_on):
            o.isLightBulbOn = True


ARM = ('Arm', 'Jaw L', 'Jaw R', 'SG90')


def arm_on(on=True):
    """Show the arm module (and hide the dock cap), or the other way round."""
    root = L.design().rootComponent
    for o in root.occurrences:
        n = L.base_name(o.component.name)
        if n.startswith(ARM):
            o.isLightBulbOn = on
        elif n == 'Dock cap':
            o.isLightBulbOn = not on
