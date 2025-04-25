import React from "react";
import PropTypes from "prop-types";
import { G, Path, Svg } from "react-native-svg";

function polarToCartesian(cx, cy, r, angle) {
  const a = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

function describeArc(cx, cy, r, startAngle, arcAngle) {
  const endAngle = startAngle + arcAngle;
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = arcAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y}
          A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const ArcShape = ({
  dimensions,
  color,
  strokeCap,
  startAngle,
  arcAngle,
  isBezian,
}) => {
  const { radius, innerRadius, width } = dimensions;
  const r = radius - width / 2;
  const pathData = describeArc(radius, radius, r, startAngle, arcAngle);
  const strokeWidth = isBezian ? arcAngle * 5 : width;

  return (
    <Path
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeCap}
      fill="none"
    />
  );
};

const Background = ({ dimensions, color }) => (
  <ArcShape
    dimensions={dimensions}
    color={color}
    startAngle={0}
    arcAngle={360}
  />
);

const getArcAngle = (percentage) => (percentage / 100) * 360;
const shouldShowDivider = (sections, dividerSize) =>
  sections?.length > 1 && !Number.isNaN(dividerSize);

const Sections = ({
  dimensions,
  paintedSections,
  sections,
  shouldShowRoundDividers,
  strokeCapForLargeBands,
}) => {
  let startValue = 0;
  const { dividerSize } = dimensions;
  const showDividers = shouldShowDivider(sections, dividerSize);
  return sections.map((section, idx) => {
    const { percentage, color } = section;
    const startAngle = (startValue / 100) * 360;
    const arcAngle = getArcAngle(percentage);
    startValue += percentage;

    const arcProps = {
      key: idx,
      dimensions,
      color,
      startAngle: showDividers ? startAngle + dividerSize : startAngle,
      arcAngle: showDividers ? arcAngle - dividerSize : arcAngle,
      strokeCap: strokeCapForLargeBands,
    };

    if (shouldShowRoundDividers) {
      paintedSections.push({
        percentage,
        color,
        startAngle,
        arcAngle,
      });
    }

    return <ArcShape {...arcProps} />;
  });
};

const RoundDividers = ({
  dimensions,
  paintedSections,
  backgroundColor,
  visible,
}) => {
  const { dividerSize } = dimensions;
  const dividerOffSet = dividerSize * 2 + 6;
  const strokeCap = "butt";
  const isBezian = true;

  if (!(paintedSections?.length > 1 && visible)) return null;

  return (
    <>
      {paintedSections.flatMap((section, index) => {
        const { color, startAngle, arcAngle } = section;
        return [...Array(dividerSize + 2).keys()].flatMap((i) => [
          <ArcShape
            key={`${index}-bg-${i}`}
            dimensions={dimensions}
            color={backgroundColor}
            startAngle={startAngle + arcAngle + dividerSize + i - dividerOffSet}
            arcAngle={1}
            isBezian={isBezian}
            strokeCap={strokeCap}
          />,
          <ArcShape
            key={`${index}-fg-${i}`}
            dimensions={dimensions}
            color={color}
            startAngle={startAngle + arcAngle - dividerSize + i - dividerOffSet}
            arcAngle={1}
            isBezian={isBezian}
            strokeCap={strokeCap}
          />,
        ]);
      })}
    </>
  );
};

const CleanUpCircles = ({ dimensions, backgroundColor, visible }) => {
  const { radius, innerRadius, width } = dimensions;

  if (width >= 100 || !visible) return null;

  const innerPath = describeArc(
    radius,
    radius,
    innerRadius - width / 2,
    0,
    360
  );
  const outerPath = describeArc(radius, radius, radius + width / 2, 0, 360);

  return (
    <>
      <Path
        d={innerPath}
        stroke={backgroundColor}
        strokeWidth={width}
        fill="none"
      />
      <Path
        d={outerPath}
        stroke={backgroundColor}
        strokeWidth={width}
        fill="none"
      />
    </>
  );
};

const Pie = ({
  sections,
  radius,
  innerRadius,
  backgroundColor,
  strokeCap,
  dividerSize,
}) => {
  const width = radius - innerRadius;
  const dimensions = { radius, innerRadius, width, dividerSize };
  const strokeCapForLargeBands =
    dividerSize > 0 || strokeCap === "butt" ? "butt" : "butt";
  const shouldShowRoundDividers = strokeCap === "round";

  let paintedSections = [];

  return (
    <Svg width={radius * 2} height={radius * 2}>
      <G rotation={-90} origin={`${radius}, ${radius}`}>
        <Background dimensions={dimensions} color={backgroundColor} />
        <Sections
          dimensions={dimensions}
          paintedSections={paintedSections}
          sections={sections}
          strokeCapForLargeBands={strokeCapForLargeBands}
          shouldShowRoundDividers={shouldShowRoundDividers}
        />
        <RoundDividers
          dimensions={dimensions}
          paintedSections={paintedSections}
          backgroundColor={backgroundColor}
          visible={shouldShowRoundDividers}
        />
        <CleanUpCircles
          dimensions={dimensions}
          backgroundColor={backgroundColor}
          visible={shouldShowRoundDividers}
        />
      </G>
    </Svg>
  );
};

export default Pie;

Pie.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.exact({
      percentage: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  radius: PropTypes.number.isRequired,
  innerRadius: PropTypes.number,
  backgroundColor: PropTypes.string,
  strokeCap: PropTypes.string,
  dividerSize: PropTypes.number,
};

Pie.defaultProps = {
  dividerSize: 0,
  innerRadius: 0,
  backgroundColor: "#fff",
  strokeCap: "butt",
};
