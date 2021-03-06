import React from 'react';
import { Link } from 'react-router-dom';

const ProductCategory = ({ category, col }) => {
  const categoryQuery = category.replace(/\//g, '&');
  const categoryURLencoded = category.replace(/\//g, '%2F');
  return (
    <div className={`col-sm-12 col-md-6 col-lg-${col} my-3 `}>
      <div className="card p-3 rounded">
        <Link className="card-img-top mx-auto justify-content-center" to={`category/${categoryURLencoded}`}>
          <img className="card-img-top mx-auto" src={`/images/Category/${categoryQuery}.png`} alt={categoryQuery} />
        </Link>
        <div className=" d-flex flex-column align-items-center pt-3 px-0 pb-0">
          <h5 className="card-title card-text">
            <Link to={`category/${categoryURLencoded}`}>{category}</Link>
          </h5>
          <Link to={`category/${categoryURLencoded}`} id="view_btn" className="btn btn-block">
            See More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCategory;
