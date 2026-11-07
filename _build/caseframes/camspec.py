# Camera cut-outs per model, in tile units from the measuring sheet: x_photo = 100 + dx/0.6, y_photo = dy/0.6.
# ("rr", dx0, dy0, dx1, dy1, r) rounded rect (dx1="R" = to the right edge of the body); ("c", dcx, dcy, dr) circle.
SPEC = {
 "iphone-17-pro-max": [("rr", 0, 12, "R", 150, 26)], "iphone-17-pro": [("rr", 0, 15, "R", 150, 26)], "iphone-air": [("rr", 0, 12, "R", 95, 24)],
 "iphone-17": [("rr", 8, 12, 120, 122, 26)],
 "iphone-16-pro-max": [("rr", 12, 10, 146, 150, 28)], "iphone-16-pro": [("rr", 12, 10, 146, 150, 28)],
 "iphone-16-plus": [("rr", 10, 12, 74, 148, 28), ("c", 100, 80, 24)], "iphone-16": [("rr", 10, 12, 74, 148, 28), ("c", 100, 80, 24)],
 "iphone-15-pro-max": [("rr", 10, 5, 135, 140, 26)], "iphone-15-pro": [("rr", 15, 15, 140, 140, 26)],
 "iphone-15-plus": [("rr", 12, 15, 120, 120, 22)], "iphone-15": [("rr", 12, 15, 120, 120, 22)],
 "iphone-14-pro-max": [("rr", 5, 8, 135, 140, 26)], "iphone-14-pro": [("rr", 15, 15, 140, 135, 24)],
 "iphone-14-plus": [("rr", 12, 15, 128, 128, 22)], "iphone-14": [("rr", 12, 15, 128, 128, 22)],
 "iphone-13-pro-max": [("rr", 12, 10, 135, 133, 24)], "iphone-13-pro": [("rr", 10, 10, 150, 140, 26)],
 "iphone-13-mini": [("rr", 0, 0, 125, 135, 24)], "iphone-13": [("rr", 0, 0, 125, 135, 24)],
 "iphone-12-pro-max": [("rr", 15, 15, 105, 120, 20)], "iphone-12-pro": [("rr", 12, 15, 105, 120, 20)],
 "iphone-12-mini": [("rr", 10, 5, 115, 125, 22)], "iphone-12": [("rr", 15, 15, 110, 125, 22)],
 "iphone-11-pro-max": [("rr", 5, 5, 120, 118, 22)], "iphone-11-pro": [("rr", 5, 5, 120, 118, 22)], "iphone-11": [("rr", 15, 15, 112, 120, 22)],
 "iphone-xr": [("rr", 5, 15, 42, 120, 18)],
 "galaxy-s25": [("rr", 17, 10, 56, 165, 19), ("c", 84, 70, 11)], "galaxy-s24": [("rr", 14, 0, 56, 175, 21)],
 "galaxy-s23": [("rr", 12, 15, 55, 170, 21)], "galaxy-s22-ultra": [("rr", 15, 10, 80, 165, 18), ("rr", 15, 10, 100, 90, 18)],
 "oneplus-12": [("c", 96, 100, 87), ("rr", 0, 13, 96, 187, 14)], "oneplus-12r": [("c", 92, 97, 83), ("rr", 0, 14, 92, 180, 14)],
 "oneplus-11": [("c", 99, 100, 80)], "oneplus-11r": [("rr", 5, 5, 160, 172, 40)],
}
def to_photo(shape, body_x1):
    X = lambda d: 100 + d / 0.6; Y = lambda d: d / 0.6
    if shape[0] == "rr":
        _, x0, y0, x1, y1, r = shape
        return ("rr", X(x0), Y(y0), body_x1 if x1 == "R" else X(x1), Y(y1), r / 0.6)
    _, cx, cy, r = shape; return ("c", X(cx), Y(cy), r / 0.6)
